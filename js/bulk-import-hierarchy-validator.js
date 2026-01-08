/**
 * Bulk Import Hierarchy Validator
 * Validates CSV/Excel imports against the parent-child hierarchy
 * Uses MCP Supabase to resolve hierarchy relationships
 * Rejects rows that violate hierarchy or have missing relationships
 */

class BulkImportHierarchyValidator {
    constructor(supabaseClient, hierarchyManager) {
        this.supabaseClient = supabaseClient;
        this.hierarchyManager = hierarchyManager;
    }

    /**
     * Validate and process bulk import data
     * @param {Array} rows - Array of objects from CSV/Excel
     * @param {Object} columnMapping - Maps CSV columns to hierarchy fields
     * @returns {Object} - { valid: [], invalid: [], errors: [] }
     */
    async validateBulkImport(rows, columnMapping = {}) {
        // Default column mapping
        const mapping = {
            device_type: columnMapping.device_type || 'device_type',
            manufacturer: columnMapping.manufacturer || 'manufacturer',
            model: columnMapping.model || 'model',
            pm_frequency: columnMapping.pm_frequency || 'pm_frequency',
            ...columnMapping
        };

        const valid = [];
        const invalid = [];
        const errors = [];

        // Load full hierarchy for validation
        await this.hierarchyManager.loadFullHierarchy();

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2; // +2 because row 1 is header, and arrays are 0-indexed

            try {
                const validation = await this.validateRow(row, mapping, rowNum);
                
                if (validation.valid) {
                    valid.push({
                        row: rowNum,
                        data: row,
                        resolved: validation.resolved
                    });
                } else {
                    invalid.push({
                        row: rowNum,
                        data: row,
                        errors: validation.errors
                    });
                    errors.push({
                        row: rowNum,
                        errors: validation.errors
                    });
                }
            } catch (error) {
                invalid.push({
                    row: rowNum,
                    data: row,
                    errors: [`Validation error: ${error.message}`]
                });
                errors.push({
                    row: rowNum,
                    errors: [`Validation error: ${error.message}`]
                });
            }
        }

        return {
            valid: valid,
            invalid: invalid,
            errors: errors,
            summary: {
                total: rows.length,
                valid: valid.length,
                invalid: invalid.length,
                successRate: rows.length > 0 ? ((valid.length / rows.length) * 100).toFixed(2) : 0
            }
        };
    }

    /**
     * Validate a single row against hierarchy
     */
    async validateRow(row, mapping, rowNum) {
        const errors = [];
        const resolved = {};

        // Extract values (case-insensitive matching)
        const deviceTypeName = this.getRowValue(row, mapping.device_type);
        const manufacturerName = this.getRowValue(row, mapping.manufacturer);
        const modelName = this.getRowValue(row, mapping.model);
        const pmFrequencyName = this.getRowValue(row, mapping.pm_frequency);

        // Validate required fields
        if (!deviceTypeName || deviceTypeName.trim() === '') {
            errors.push('Device type is required');
            return { valid: false, errors, resolved: null };
        }

        if (!manufacturerName || manufacturerName.trim() === '') {
            errors.push('Manufacturer is required');
            return { valid: false, errors, resolved: null };
        }

        if (!modelName || modelName.trim() === '') {
            errors.push('Device model is required');
            return { valid: false, errors, resolved: null };
        }

        // Resolve device type
        const deviceType = this.hierarchyManager.hierarchy.deviceTypes.find(t => 
            t.name.toLowerCase() === deviceTypeName.trim().toLowerCase() &&
            t.is_active &&
            !t.deleted_at
        );

        if (!deviceType) {
            errors.push(`Device type "${deviceTypeName}" not found. Please create it in Settings first.`);
            return { valid: false, errors, resolved: null };
        }

        resolved.device_type_id = deviceType.id;
        resolved.device_type_name = deviceType.name;

        // Resolve manufacturer (must belong to device type)
        const manufacturer = this.hierarchyManager.hierarchy.manufacturers.find(m => 
            m.name.toLowerCase() === manufacturerName.trim().toLowerCase() &&
            m.device_type_id === deviceType.id &&
            m.is_active &&
            !m.deleted_at
        );

        if (!manufacturer) {
            errors.push(`Manufacturer "${manufacturerName}" not found for device type "${deviceTypeName}". Please create it in Settings first.`);
            return { valid: false, errors, resolved: null };
        }

        resolved.manufacturer_id = manufacturer.id;
        resolved.manufacturer_name = manufacturer.name;

        // Resolve device model (must belong to manufacturer)
        const deviceModel = this.hierarchyManager.hierarchy.deviceModels.find(m => 
            m.name.toLowerCase() === modelName.trim().toLowerCase() &&
            m.manufacturer_id === manufacturer.id &&
            m.is_active &&
            !m.deleted_at
        );

        if (!deviceModel) {
            errors.push(`Device model "${modelName}" not found for manufacturer "${manufacturerName}". Please create it in Settings first.`);
            return { valid: false, errors, resolved: null };
        }

        resolved.device_model_id = deviceModel.id;
        resolved.device_model_name = deviceModel.name;

        // Resolve PM program (must exist for device model)
        const pmProgram = this.hierarchyManager.hierarchy.pmPrograms.find(p => 
            p.device_model_id === deviceModel.id &&
            p.is_active &&
            !p.deleted_at
        );

        if (!pmProgram) {
            errors.push(`No PM program found for device model "${modelName}". Please create a PM program in Settings first.`);
            return { valid: false, errors, resolved: null };
        }

        resolved.pm_program_id = pmProgram.id;
        resolved.pm_program_name = pmProgram.name;

        // Validate PM frequency if provided (optional, but if provided must match)
        if (pmFrequencyName && pmFrequencyName.trim() !== '') {
            const pmFrequency = await this.resolvePMFrequency(pmFrequencyName.trim());
            if (!pmFrequency) {
                errors.push(`PM frequency "${pmFrequencyName}" not found.`);
                return { valid: false, errors, resolved: null };
            }

            if (pmProgram.pm_frequency_id !== pmFrequency.id) {
                errors.push(`PM frequency "${pmFrequencyName}" does not match the PM program's frequency for this model.`);
                return { valid: false, errors, resolved: null };
            }

            resolved.pm_frequency_id = pmFrequency.id;
            resolved.pm_frequency_name = pmFrequency.name;
        } else {
            // Use PM program's frequency
            const pmFreq = this.hierarchyManager.hierarchy.pmPrograms
                .find(p => p.id === pmProgram.id)?.pm_frequencies;
            if (pmFreq) {
                resolved.pm_frequency_id = pmFreq.id;
                resolved.pm_frequency_name = pmFreq.name;
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            resolved: resolved
        };
    }

    /**
     * Get value from row (case-insensitive column matching)
     */
    getRowValue(row, columnName) {
        if (!columnName) return null;

        // Try exact match first
        if (row[columnName] !== undefined) {
            return row[columnName];
        }

        // Try case-insensitive match
        const lowerColumnName = columnName.toLowerCase();
        for (const key in row) {
            if (key.toLowerCase() === lowerColumnName) {
                return row[key];
            }
        }

        return null;
    }

    /**
     * Resolve PM frequency by name
     */
    async resolvePMFrequency(name) {
        // Try to find in already loaded hierarchy (if PM frequencies are loaded)
        // Otherwise query directly
        const { data, error } = await this.supabaseClient
            .from('pm_frequencies')
            .select('id, name, days')
            .eq('is_active', true)
            .is('deleted_at', null)
            .ilike('name', `%${name}%`)
            .limit(1)
            .single();

        if (error || !data) {
            return null;
        }

        return data;
    }

    /**
     * Generate error report for failed rows
     */
    generateErrorReport(validationResult) {
        if (validationResult.invalid.length === 0) {
            return null;
        }

        let report = `Bulk Import Validation Report\n`;
        report += `================================\n\n`;
        report += `Total Rows: ${validationResult.summary.total}\n`;
        report += `Valid: ${validationResult.summary.valid}\n`;
        report += `Invalid: ${validationResult.summary.invalid}\n`;
        report += `Success Rate: ${validationResult.summary.successRate}%\n\n`;
        report += `Invalid Rows:\n`;
        report += `-------------\n\n`;

        validationResult.invalid.forEach(item => {
            report += `Row ${item.row}:\n`;
            report += `  Data: ${JSON.stringify(item.data)}\n`;
            report += `  Errors:\n`;
            item.errors.forEach(error => {
                report += `    - ${error}\n`;
            });
            report += `\n`;
        });

        return report;
    }

    /**
     * Generate CSV template with example data
     */
    generateCSVTemplate() {
        const headers = ['device_type', 'manufacturer', 'model', 'pm_frequency'];
        const example = ['Defibrillator', 'Zoll', 'R Series', 'Annual'];
        
        return [
            headers.join(','),
            example.join(',')
        ].join('\n');
    }
}

// Expose globally
window.BulkImportHierarchyValidator = BulkImportHierarchyValidator;
