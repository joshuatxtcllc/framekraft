import * as storage from "../mongoStorage";
import { passwordService } from "../auth/services/passwordService";

async function createDemoUser() {
  try {
    console.log("Creating demo user...");
    
    const email = "demo@framecraft.com";
    const password = "demo123456";
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    
    if (existingUser) {
      console.log("Demo user already exists!");
      return;
    }
    
    // Hash password
    const passwordHash = await passwordService.hashPassword(password);
    
    // Create user
    const newUser = await storage.createUser({
      email,
      password: passwordHash,
      firstName: "Demo",
      lastName: "User",
      businessName: "Demo Framing Co.",
      role: "owner",
      emailVerified: true,
    });
    
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