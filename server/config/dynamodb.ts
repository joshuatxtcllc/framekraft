import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// AWS Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const IS_LOCAL = process.env.DYNAMODB_LOCAL === 'true';

// Create DynamoDB Client
const client = new DynamoDBClient({
  region: AWS_REGION,
  ...(IS_LOCAL 
    ? {
        endpoint: 'http://localhost:8000',
        credentials: {
          accessKeyId: 'dummy',
          secretAccessKey: 'dummy'
        }
      }
    : {
        credentials: AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY ? {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY
        } : undefined // Use IAM role if no credentials provided
      }
  )
});

// Create Document Client for easier JSON handling
export const dynamodb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// Table names
export const TABLES = {
  USERS: process.env.DYNAMODB_USERS_TABLE || 'framekraft-users',
  SESSIONS: process.env.DYNAMODB_SESSIONS_TABLE || 'framekraft-sessions',
  REFRESH_TOKENS: process.env.DYNAMODB_REFRESH_TOKENS_TABLE || 'framekraft-refresh-tokens',
  EMAIL_VERIFICATIONS: process.env.DYNAMODB_EMAIL_VERIFICATIONS_TABLE || 'framekraft-email-verifications',
  PASSWORD_RESETS: process.env.DYNAMODB_PASSWORD_RESETS_TABLE || 'framekraft-password-resets',
};

// DynamoDB Table Schemas
export const TABLE_SCHEMAS = {
  USERS: {
    TableName: TABLES.USERS,
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'N' }
    ],
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'email-index',
        KeySchema: [
          { AttributeName: 'email', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: 'createdAt-index',
        KeySchema: [
          { AttributeName: 'createdAt', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    StreamSpecification: {
      StreamEnabled: true,
      StreamViewType: 'NEW_AND_OLD_IMAGES'
    },
    PointInTimeRecoverySpecification: {
      PointInTimeRecoveryEnabled: true
    },
    SSESpecification: {
      Enabled: true,
      SSEType: 'AES256'
    },
    Tags: [
      { Key: 'Application', Value: 'FrameKraft' },
      { Key: 'Environment', Value: process.env.NODE_ENV || 'development' }
    ]
  },
  
  SESSIONS: {
    TableName: TABLES.SESSIONS,
    AttributeDefinitions: [
      { AttributeName: 'sessionId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'expiresAt', AttributeType: 'N' }
    ],
    KeySchema: [
      { AttributeName: 'sessionId', KeyType: 'HASH' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'userId-index',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'expiresAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    TimeToLiveSpecification: {
      AttributeName: 'ttl',
      Enabled: true
    }
  },
  
  REFRESH_TOKENS: {
    TableName: TABLES.REFRESH_TOKENS,
    AttributeDefinitions: [
      { AttributeName: 'token', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'expiresAt', AttributeType: 'N' }
    ],
    KeySchema: [
      { AttributeName: 'token', KeyType: 'HASH' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'userId-index',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'expiresAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    TimeToLiveSpecification: {
      AttributeName: 'ttl',
      Enabled: true
    }
  },
  
  EMAIL_VERIFICATIONS: {
    TableName: TABLES.EMAIL_VERIFICATIONS,
    AttributeDefinitions: [
      { AttributeName: 'token', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' }
    ],
    KeySchema: [
      { AttributeName: 'token', KeyType: 'HASH' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'userId-index',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    TimeToLiveSpecification: {
      AttributeName: 'ttl',
      Enabled: true
    }
  },
  
  PASSWORD_RESETS: {
    TableName: TABLES.PASSWORD_RESETS,
    AttributeDefinitions: [
      { AttributeName: 'token', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' }
    ],
    KeySchema: [
      { AttributeName: 'token', KeyType: 'HASH' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'userId-index',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    TimeToLiveSpecification: {
      AttributeName: 'ttl',
      Enabled: true
    }
  }
};

// Helper function to create TTL timestamp
export const getTTL = (seconds: number): number => {
  return Math.floor(Date.now() / 1000) + seconds;
};

// Initialize tables (for local development or first-time setup)
import { CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

export async function initializeTables() {
  console.log('Checking DynamoDB tables...');
  
  for (const [name, schema] of Object.entries(TABLE_SCHEMAS)) {
    try {
      // Check if table exists
      await client.send(new DescribeTableCommand({ 
        TableName: schema.TableName 
      }));
      console.log(`✓ Table ${schema.TableName} exists`);
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        console.log(`Creating table ${schema.TableName}...`);
        try {
          await client.send(new CreateTableCommand(schema as any));
          console.log(`✓ Table ${schema.TableName} created`);
        } catch (createError) {
          console.error(`Failed to create table ${schema.TableName}:`, createError);
        }
      } else {
        console.error(`Error checking table ${schema.TableName}:`, error);
      }
    }
  }
  
  console.log('✅ DynamoDB initialization complete');
}

export default dynamodb;