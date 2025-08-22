/**
 * CSV Product Import Utilities
 * Handles parsing, validation, and import of wholesaler products from CSV files
 */

import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { IWholesalerProduct } from '../models/index';

// Define the expected CSV structure
export interface CSVProductRow {
  productCode: string;          // Required: SKU/Part Number
  productName: string;          // Required: Product Name
  category: string;             // Required: frame|mat|glazing|hardware|mounting|other
  subcategory?: string;         // Optional: wood|metal|conservation|etc
  description?: string;         // Optional: Product description
  unitType: string;            // Required: linear_foot|square_foot|each|box|sheet|roll
  wholesalePrice: string;      // Required: Numeric price
  suggestedRetail?: string;    // Optional: Numeric price
  minQuantity?: string;        // Optional: Minimum order quantity (default: 1)
  packSize?: string;           // Optional: Pack size (default: 1)
  leadTime?: string;           // Optional: e.g., "2-3 days", "1 week"
  stockStatus?: string;        // Optional: available|low_stock|out_of_stock|discontinued
  vendorCatalogPage?: string;  // Optional: Page reference in catalog
}

// Valid values for enums
export const VALID_CATEGORIES = ['frame', 'mat', 'glazing', 'hardware', 'mounting', 'other'];
export const VALID_UNIT_TYPES = ['linear_foot', 'square_foot', 'each', 'box', 'sheet', 'roll'];
export const VALID_STOCK_STATUS = ['available', 'low_stock', 'out_of_stock', 'discontinued'];

// CSV headers in order
export const CSV_HEADERS = [
  'Product Code',
  'Product Name',
  'Category',
  'Subcategory',
  'Description',
  'Unit Type',
  'Wholesale Price',
  'Suggested Retail',
  'Min Quantity',
  'Pack Size',
  'Lead Time',
  'Stock Status',
  'Catalog Page'
];

// Map CSV headers to object keys
const headerMapping: Record<string, keyof CSVProductRow> = {
  'Product Code': 'productCode',
  'Product Name': 'productName',
  'Category': 'category',
  'Subcategory': 'subcategory',
  'Description': 'description',
  'Unit Type': 'unitType',
  'Wholesale Price': 'wholesalePrice',
  'Suggested Retail': 'suggestedRetail',
  'Min Quantity': 'minQuantity',
  'Pack Size': 'packSize',
  'Lead Time': 'leadTime',
  'Stock Status': 'stockStatus',
  'Catalog Page': 'vendorCatalogPage'
};

/**
 * Generate example CSV content with sample data
 */
export async function generateExampleCSV(): Promise<string> {
  const exampleData = [
    {
      'Product Code': 'LJ-W001',
      'Product Name': 'Classic Oak Frame 1.5"',
      'Category': 'frame',
      'Subcategory': 'wood',
      'Description': 'Premium oak wood frame with natural finish',
      'Unit Type': 'linear_foot',
      'Wholesale Price': '12.50',
      'Suggested Retail': '25.00',
      'Min Quantity': '10',
      'Pack Size': '10',
      'Lead Time': '2-3 days',
      'Stock Status': 'available',
      'Catalog Page': '15'
    },
    {
      'Product Code': 'CR-M002',
      'Product Name': 'Conservation Mat Board 32x40',
      'Category': 'mat',
      'Subcategory': 'conservation',
      'Description': 'Acid-free, museum quality mat board',
      'Unit Type': 'sheet',
      'Wholesale Price': '8.75',
      'Suggested Retail': '16.50',
      'Min Quantity': '25',
      'Pack Size': '25',
      'Lead Time': '1 week',
      'Stock Status': 'available',
      'Catalog Page': '42'
    },
    {
      'Product Code': 'TG-UV003',
      'Product Name': 'UV Protection Glass 24x36',
      'Category': 'glazing',
      'Subcategory': 'specialty',
      'Description': '99% UV protection museum glass',
      'Unit Type': 'each',
      'Wholesale Price': '45.00',
      'Suggested Retail': '85.00',
      'Min Quantity': '1',
      'Pack Size': '1',
      'Lead Time': '3-5 days',
      'Stock Status': 'low_stock',
      'Catalog Page': '78'
    }
  ];

  return new Promise((resolve, reject) => {
    stringify(exampleData, { 
      header: true,
      columns: CSV_HEADERS
    }, (err, output) => {
      if (err) reject(err);
      else resolve(output);
    });
  });
}

/**
 * Validate a single product row
 */
export function validateProductRow(row: CSVProductRow, rowNumber: number): { 
  isValid: boolean; 
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!row.productCode?.trim()) {
    errors.push(`Row ${rowNumber}: Product Code is required`);
  }
  if (!row.productName?.trim()) {
    errors.push(`Row ${rowNumber}: Product Name is required`);
  }
  if (!row.category?.trim()) {
    errors.push(`Row ${rowNumber}: Category is required`);
  } else if (!VALID_CATEGORIES.includes(row.category.toLowerCase())) {
    errors.push(`Row ${rowNumber}: Invalid category '${row.category}'. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }
  
  if (!row.unitType?.trim()) {
    errors.push(`Row ${rowNumber}: Unit Type is required`);
  } else if (!VALID_UNIT_TYPES.includes(row.unitType.toLowerCase().replace(/ /g, '_'))) {
    errors.push(`Row ${rowNumber}: Invalid unit type '${row.unitType}'. Must be one of: ${VALID_UNIT_TYPES.join(', ')}`);
  }

  // Validate prices
  if (!row.wholesalePrice?.trim()) {
    errors.push(`Row ${rowNumber}: Wholesale Price is required`);
  } else {
    const price = parseFloat(row.wholesalePrice);
    if (isNaN(price) || price < 0) {
      errors.push(`Row ${rowNumber}: Wholesale Price must be a positive number`);
    }
  }

  if (row.suggestedRetail?.trim()) {
    const retail = parseFloat(row.suggestedRetail);
    if (isNaN(retail) || retail < 0) {
      errors.push(`Row ${rowNumber}: Suggested Retail must be a positive number`);
    } else {
      const wholesale = parseFloat(row.wholesalePrice);
      if (!isNaN(wholesale) && retail < wholesale) {
        warnings.push(`Row ${rowNumber}: Suggested Retail is less than Wholesale Price`);
      }
    }
  }

  // Validate quantities
  if (row.minQuantity?.trim()) {
    const qty = parseInt(row.minQuantity);
    if (isNaN(qty) || qty < 1) {
      errors.push(`Row ${rowNumber}: Min Quantity must be a positive integer`);
    }
  }

  if (row.packSize?.trim()) {
    const size = parseInt(row.packSize);
    if (isNaN(size) || size < 1) {
      errors.push(`Row ${rowNumber}: Pack Size must be a positive integer`);
    }
  }

  // Validate stock status
  if (row.stockStatus?.trim() && !VALID_STOCK_STATUS.includes(row.stockStatus.toLowerCase().replace(/ /g, '_'))) {
    warnings.push(`Row ${rowNumber}: Unknown stock status '${row.stockStatus}'. Using 'available' as default`);
  }

  // Check for overly long fields
  if (row.productCode?.length > 100) {
    errors.push(`Row ${rowNumber}: Product Code is too long (max 100 characters)`);
  }
  if (row.productName?.length > 200) {
    errors.push(`Row ${rowNumber}: Product Name is too long (max 200 characters)`);
  }
  if (row.description?.length > 1000) {
    warnings.push(`Row ${rowNumber}: Description is very long (over 1000 characters)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Parse CSV content and validate all rows
 */
export async function parseAndValidateCSV(csvContent: string): Promise<{
  valid: CSVProductRow[];
  invalid: Array<{ row: CSVProductRow; errors: string[] }>;
  warnings: string[];
  totalRows: number;
}> {
  return new Promise((resolve, reject) => {
    const valid: CSVProductRow[] = [];
    const invalid: Array<{ row: CSVProductRow; errors: string[] }> = [];
    const allWarnings: string[] = [];
    let rowNumber = 0;

    parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      skip_records_with_error: true
    })
    .on('data', (record: any) => {
      rowNumber++;
      
      // Map CSV headers to our object structure
      const mappedRow: CSVProductRow = {} as CSVProductRow;
      for (const [header, value] of Object.entries(record)) {
        const key = headerMapping[header];
        if (key) {
          mappedRow[key] = (value as string)?.trim() || '';
        }
      }

      // Normalize some fields
      if (mappedRow.category) {
        mappedRow.category = mappedRow.category.toLowerCase();
      }
      if (mappedRow.unitType) {
        mappedRow.unitType = mappedRow.unitType.toLowerCase().replace(/ /g, '_');
      }
      if (mappedRow.stockStatus) {
        mappedRow.stockStatus = mappedRow.stockStatus.toLowerCase().replace(/ /g, '_');
      }

      // Validate the row
      const validation = validateProductRow(mappedRow, rowNumber);
      
      if (validation.warnings.length > 0) {
        allWarnings.push(...validation.warnings);
      }

      if (validation.isValid) {
        valid.push(mappedRow);
      } else {
        invalid.push({ row: mappedRow, errors: validation.errors });
      }
    })
    .on('error', (err) => {
      reject(new Error(`CSV parsing error: ${err.message}`));
    })
    .on('end', () => {
      resolve({
        valid,
        invalid,
        warnings: allWarnings,
        totalRows: rowNumber
      });
    });
  });
}

/**
 * Convert validated CSV rows to database product format
 */
export function convertToProductData(
  rows: CSVProductRow[], 
  wholesalerId: string
): Partial<IWholesalerProduct>[] {
  return rows.map(row => ({
    wholesalerId: wholesalerId as any, // Will be converted to ObjectId in storage
    productCode: row.productCode.trim(),
    productName: row.productName.trim(),
    category: row.category.toLowerCase(),
    subcategory: row.subcategory?.trim() || undefined,
    description: row.description?.trim() || undefined,
    unitType: row.unitType.toLowerCase().replace(/ /g, '_'),
    wholesalePrice: parseFloat(row.wholesalePrice),
    suggestedRetail: row.suggestedRetail ? parseFloat(row.suggestedRetail) : undefined,
    minQuantity: row.minQuantity ? parseInt(row.minQuantity) : 1,
    packSize: row.packSize ? parseInt(row.packSize) : 1,
    leadTime: row.leadTime?.trim() || undefined,
    stockStatus: row.stockStatus?.toLowerCase().replace(/ /g, '_') || 'available',
    vendorCatalogPage: row.vendorCatalogPage?.trim() || undefined,
    isActive: true,
    lastUpdated: new Date()
  }));
}

/**
 * Generate CSV template (headers only)
 */
export async function generateCSVTemplate(): Promise<string> {
  return CSV_HEADERS.join(',') + '\n';
}