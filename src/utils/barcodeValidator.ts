import { BarcodeItem, DuplicatePolicy } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  isDuplicate?: boolean;
}

// Code 128 valid ASCII characters range (32 to 126)
const CODE128_VALID_REGEX = /^[\x20-\x7E]+$/;

/**
 * Validates a single barcode string for Code 128 compliance.
 */
export function validateBarcodeValue(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      errorMessage: 'Barcode number is required.',
    };
  }

  if (value.length > 50) {
    return {
      isValid: false,
      errorMessage: 'Barcode exceeds maximum allowed length (50 characters).',
    };
  }

  if (!CODE128_VALID_REGEX.test(value)) {
    return {
      isValid: false,
      errorMessage: 'Barcode contains unsupported characters (Code 128 supports standard ASCII).',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Validates an entire array of BarcodeItem rows, performing format validation
 * and batch-level duplicate detection according to configured DuplicatePolicy.
 */
export function validateBatchRows(
  items: BarcodeItem[],
  duplicatePolicy: DuplicatePolicy = 'PREVENT'
): BarcodeItem[] {
  const valueCounts = new Map<string, number>();

  // Count non-empty values
  items.forEach((item) => {
    const val = item.barcodeValue;
    if (val && val.trim() !== '') {
      valueCounts.set(val, (valueCounts.get(val) || 0) + 1);
    }
  });

  return items.map((item) => {
    const val = item.barcodeValue;
    const formatValidation = validateBarcodeValue(val);

    if (!formatValidation.isValid) {
      return {
        ...item,
        isValid: false,
        validationError: formatValidation.errorMessage,
        isDuplicate: false,
        status: 'INVALID',
      };
    }

    const count = valueCounts.get(val) || 0;
    const isDuplicate = count > 1;

    if (isDuplicate) {
      if (duplicatePolicy === 'PREVENT') {
        return {
          ...item,
          isValid: false,
          validationError: 'Duplicate barcode detected in current batch.',
          isDuplicate: true,
          status: 'INVALID',
        };
      } else if (duplicatePolicy === 'WARN') {
        return {
          ...item,
          isValid: true,
          validationError: 'Warning: Duplicate barcode in batch.',
          isDuplicate: true,
          status: 'VALID',
        };
      }
    }

    return {
      ...item,
      isValid: true,
      validationError: undefined,
      isDuplicate: false,
      status: 'VALID',
    };
  });
}

/**
 * Validates a single barcode row, returning format validity and error message.
 */
export function validateBarcodeRow(value: string, rowNumber?: number): ValidationResult {
  return validateBarcodeValue(value);
}

/**
 * Checks an array of barcode strings and returns a Set containing all duplicate strings.
 */
export function checkDuplicates(values: string[]): Set<string> {
  const counts = new Map<string, number>();
  values.forEach((v) => {
    if (v && v.trim() !== '') {
      const trimmed = v.trim();
      counts.set(trimmed, (counts.get(trimmed) || 0) + 1);
    }
  });

  const duplicates = new Set<string>();
  counts.forEach((count, key) => {
    if (count > 1) {
      duplicates.add(key);
    }
  });

  return duplicates;
}

/**
 * Suggests sensor type classification based on standard ATM sensor naming schemas
 * (e.g. ATM-1-CDS-1 -> CDS Cash Dispenser Sensor, HDS -> Head Detection Sensor, PIR -> Motion Sensor)
 */
export function inferSensorMetadata(barcodeValue: string): { sensorType: string; atmType: string } {
  const upper = barcodeValue.toUpperCase();
  let sensorType = 'General Sensor';
  let atmType = 'ATM Standard';

  if (upper.includes('CDS')) sensorType = 'Cash Dispenser Sensor (CDS)';
  else if (upper.includes('HDS')) sensorType = 'Head Detection Sensor (HDS)';
  else if (upper.includes('PIR')) sensorType = 'PIR Motion Sensor';
  else if (upper.includes('DS') || upper.includes('DOOR')) sensorType = 'Door Interlock Sensor';
  else if (upper.includes('SHUTTER')) sensorType = 'Shutter Position Sensor';
  else if (upper.includes('STACKER')) sensorType = 'Stacker Level Sensor';

  if (upper.startsWith('BR-') || upper.startsWith('BR')) atmType = 'Branch Recycler (BR)';
  else if (upper.startsWith('L-') || upper.startsWith('L')) atmType = 'Lobby / Wall ATM (L)';
  else if (upper.startsWith('ATM-') || upper.startsWith('ATM')) atmType = 'Standard ATM Series';

  return { sensorType, atmType };
}
