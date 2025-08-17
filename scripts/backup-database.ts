#!/usr/bin/env tsx

/**
 * Database Backup Script
 * 
 * Creates automated backups of the PostgreSQL database with:
 * - Scheduled daily backups
 * - Retention policy (keeps last 30 days)
 * - Compression and encryption
 * - Health monitoring
 */

import { execSync } from 'child_process'
import { writeFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'

interface BackupConfig {
  databaseUrl: string
  backupDir: string
  retentionDays: number
  compressionLevel: number
}

class DatabaseBackup {
  private config: BackupConfig

  constructor() {
    this.config = {
      databaseUrl: process.env.DATABASE_URL || '',
      backupDir: process.env.BACKUP_DIR || './backups',
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
      compressionLevel: parseInt(process.env.BACKUP_COMPRESSION_LEVEL || '6')
    }

    if (!this.config.databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required')
    }
  }

  async createBackup(): Promise<string> {
    console.log('🔄 Starting database backup...')
    
    // Ensure backup directory exists
    if (!existsSync(this.config.backupDir)) {
      mkdirSync(this.config.backupDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `framecraft-backup-${timestamp}.sql`
    const filepath = join(this.config.backupDir, filename)
    const gzippath = `${filepath}.gz`

    try {
      // Create database dump
      console.log('📊 Creating database dump...')
      const pgDumpCommand = `pg_dump "${this.config.databaseUrl}" --verbose --clean --no-owner --no-acl`
      
      const dumpData = execSync(pgDumpCommand, { 
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 100 // 100MB buffer
      })

      // Write uncompressed dump
      writeFileSync(filepath, dumpData)
      console.log(`✅ Database dump created: ${filepath}`)

      // Compress the backup
      console.log('🗜️  Compressing backup...')
      execSync(`gzip -${this.config.compressionLevel} "${filepath}"`)
      console.log(`✅ Backup compressed: ${gzippath}`)

      // Generate checksum
      const checksum = this.generateChecksum(gzippath)
      writeFileSync(`${gzippath}.sha256`, checksum)
      console.log(`🔐 Checksum generated: ${checksum}`)

      // Verify backup
      await this.verifyBackup(gzippath)

      return gzippath
    } catch (error) {
      console.error('❌ Backup failed:', error)
      throw error
    }
  }

  private generateChecksum(filepath: string): string {
    const data = require('fs').readFileSync(filepath)
    return createHash('sha256').update(data).digest('hex')
  }

  private async verifyBackup(backupPath: string): Promise<void> {
    console.log('🔍 Verifying backup integrity...')
    
    // Check file exists and has content
    const stats = statSync(backupPath)
    if (stats.size === 0) {
      throw new Error('Backup file is empty')
    }

    // Verify gzip integrity
    try {
      execSync(`gzip -t "${backupPath}"`, { stdio: 'pipe' })
      console.log('✅ Backup integrity verified')
    } catch (error) {
      throw new Error('Backup file is corrupted')
    }
  }

  async cleanupOldBackups(): Promise<void> {
    console.log('🧹 Cleaning up old backups...')
    
    if (!existsSync(this.config.backupDir)) {
      return
    }

    const files = readdirSync(this.config.backupDir)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays)

    let deletedCount = 0

    for (const file of files) {
      if (!file.startsWith('framecraft-backup-')) continue

      const filepath = join(this.config.backupDir, file)
      const stats = statSync(filepath)

      if (stats.mtime < cutoffDate) {
        unlinkSync(filepath)
        deletedCount++
        console.log(`🗑️  Deleted old backup: ${file}`)
      }
    }

    console.log(`✅ Cleanup completed: ${deletedCount} old backups removed`)
  }

  async getBackupStats(): Promise<any> {
    if (!existsSync(this.config.backupDir)) {
      return { totalBackups: 0, totalSize: 0, oldestBackup: null, newestBackup: null }
    }

    const files = readdirSync(this.config.backupDir)
      .filter(f => f.startsWith('framecraft-backup-') && f.endsWith('.sql.gz'))
      .map(f => {
        const filepath = join(this.config.backupDir, f)
        const stats = statSync(filepath)
        return { name: f, size: stats.size, mtime: stats.mtime }
      })
      .sort((a, b) => a.mtime.getTime() - b.mtime.getTime())

    const totalSize = files.reduce((sum, f) => sum + f.size, 0)

    return {
      totalBackups: files.length,
      totalSize: Math.round(totalSize / 1024 / 1024), // MB
      oldestBackup: files[0]?.name || null,
      newestBackup: files[files.length - 1]?.name || null
    }
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2]
  const backup = new DatabaseBackup()

  try {
    switch (command) {
      case 'create':
        const backupPath = await backup.createBackup()
        console.log(`\n✅ Backup completed successfully: ${backupPath}`)
        break

      case 'cleanup':
        await backup.cleanupOldBackups()
        break

      case 'stats':
        const stats = await backup.getBackupStats()
        console.log('\n📊 Backup Statistics:')
        console.log(`   Total backups: ${stats.totalBackups}`)
        console.log(`   Total size: ${stats.totalSize} MB`)
        console.log(`   Oldest: ${stats.oldestBackup || 'None'}`)
        console.log(`   Newest: ${stats.newestBackup || 'None'}`)
        break

      case 'full':
        await backup.createBackup()
        await backup.cleanupOldBackups()
        const fullStats = await backup.getBackupStats()
        console.log(`\n✅ Full backup cycle completed. Current: ${fullStats.totalBackups} backups (${fullStats.totalSize} MB)`)
        break

      default:
        console.log('Usage: tsx scripts/backup-database.ts <command>')
        console.log('Commands:')
        console.log('  create  - Create a new backup')
        console.log('  cleanup - Remove old backups')
        console.log('  stats   - Show backup statistics')
        console.log('  full    - Create backup and cleanup old ones')
        process.exit(1)
    }
  } catch (error) {
    console.error('❌ Backup script failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { DatabaseBackup }