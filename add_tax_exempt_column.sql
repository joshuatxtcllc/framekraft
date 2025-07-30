
-- Add the missing tax_exempt column to the orders table
ALTER TABLE orders ADD COLUMN tax_exempt BOOLEAN DEFAULT false;
