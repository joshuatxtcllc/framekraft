import { db } from "../db";
import { authUsers } from "../auth/schema";
import { passwordService } from "../auth/services/passwordService";
import { eq } from "drizzle-orm";

async function createDemoUser() {
  try {
    console.log("Creating demo user...");
    
    const email = "demo@framecraft.com";
    const password = "demo123456";
    
    // Check if user already exists
    const existingUser = await db.select()
      .from(authUsers)
      .where(eq(authUsers.email, email))
      .limit(1);
    
    if (existingUser.length > 0) {
      console.log("Demo user already exists!");
      return;
    }
    
    // Hash password
    const passwordHash = await passwordService.hashPassword(password);
    
    // Create user
    const [newUser] = await db.insert(authUsers).values({
      email,
      passwordHash,
      firstName: "Demo",
      lastName: "User",
      businessName: "Demo Framing Co.",
      role: "owner",
      emailVerified: true,
    }).returning();
    
    console.log("Demo user created successfully!");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("User ID:", newUser.id);
    
  } catch (error) {
    console.error("Error creating demo user:", error);
  } finally {
    process.exit(0);
  }
}

createDemoUser();