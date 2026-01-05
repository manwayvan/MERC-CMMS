// Work Order PDF Report Generation
async function generateWorkOrderPDF() {
    let workOrderId = document.getElementById('workorder-id')?.value;
    if (!workOrderId) {
        // Try to get from current work order ID
        const currentWOId = WorkOrderManager?.currentWorkOrderId;
        if (!currentWOId) {
            if (typeof showToast === 'function') {
                showToast('Work order ID not found', 'error');
            }
            return;
        }
        workOrderId = currentWOId;
    }

    try {
        // Show loading
        if (typeof showToast === 'function') {
            showToast('Generating PDF report...', 'info');
        }

        // Get Supabase client
        const supabaseClient = window.supabaseClient || window.sharedSupabaseClient;
        if (!supabaseClient) {
            throw new Error('Supabase client not available');
        }

        // Load complete work order data
        const { data: workOrder, error: woError } = await supabaseClient
            .from('work_orders')
            .select(`
                *,
                assets:asset_id(id, name, serial_number),
                technicians:assigned_technician_id(id, full_name),
                customers:assets!inner(customers:customer_id(id, name))
            `)
            .eq('id', workOrderId)
            .single();

        if (woError) throw woError;

        // Load parts
        const { data: parts } = await supabaseClient
            .from('work_order_parts')
            .select(`
                *,
                parts:part_id(id, part_number, name, unit_of_measure)
            `)
            .eq('work_order_id', workOrderId);

        // Load labor costs
        const { data: labor } = await supabaseClient
            .from('work_order_labor')
            .select(`
                *,
                technicians:technician_id(id, full_name)
            `)
            .eq('work_order_id', workOrderId);

        // Load additional costs
        const { data: additionalCosts } = await supabaseClient
            .from('work_order_additional_costs')
            .select('*')
            .eq('work_order_id', workOrderId);

        // Load work order type
        let workOrderType = null;
        if (workOrder.type) {
            const { data: typeData } = await supabaseClient
                .from('work_order_types')
                .select('*')
                .eq('code', workOrder.type)
                .single();
            workOrderType = typeData;
        }

        // Create PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'letter'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = 20;
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);

        // Helper function to add new page if needed
        const checkPageBreak = (requiredHeight) => {
            if (yPos + requiredHeight > pageHeight - margin) {
                doc.addPage();
                yPos = margin;
                return true;
            }
            return false;
        };

        // Load and add logo
        let logoAdded = false;
        try {
            const logoImg = new Image();
            logoImg.crossOrigin = 'anonymous';
            logoImg.src = '/resources/Logo_without%20name.png';
            
            await new Promise((resolve, reject) => {
                logoImg.onload = () => {
                    try {
                        const logoWidth = 30;
                        const logoHeight = 30;
                        doc.addImage(logoImg, 'PNG', margin, yPos, logoWidth, logoHeight);
                        logoAdded = true;
                        resolve();
                    } catch (err) {
                        console.warn('Could not add logo image:', err);
                        resolve(); // Continue without logo
                    }
                };
                logoImg.onerror = () => {
                    console.warn('Could not load logo image');
                    resolve(); // Continue without logo
                };
                // Timeout after 2 seconds
                setTimeout(resolve, 2000);
            });
        } catch (err) {
            console.warn('Logo loading error:', err);
        }

        // Header with business name - ensure full text fits
        const companyName = 'M.E.R.C. Medical Equipment Repair Company, LLC';
        const logoOffset = logoAdded ? 35 : 0;
        
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        // Split company name if too long, or use smaller font
        const companyNameLines = doc.splitTextToSize(companyName, pageWidth - margin - logoOffset - 10);
        companyNameLines.forEach((line, index) => {
            doc.text(line, margin + logoOffset, yPos + 10 + (index * 7));
        });
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text('Work Order Report', margin + logoOffset, yPos + 10 + (companyNameLines.length * 7) + 5);
        
        yPos += 15 + (companyNameLines.length * 7) + 10;

        // Work Order Details Section
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Work Order Details', margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        const details = [
            ['Work Order ID:', workOrder.id || 'N/A'],
            ['Work Order Number:', workOrder.work_order_number || workOrder.id || 'N/A'],
            ['Status:', (workOrder.status || 'open').toUpperCase()],
            ['Priority:', (workOrder.priority || 'medium').toUpperCase()],
            ['Type:', workOrderType?.label || workOrder.type || 'N/A'],
            ['Created Date:', workOrder.created_date ? new Date(workOrder.created_date).toLocaleDateString() : (workOrder.created_at ? new Date(workOrder.created_at).toLocaleDateString() : 'N/A')],
            ['Due Date:', workOrder.due_date ? new Date(workOrder.due_date).toLocaleDateString() : 'N/A'],
            ['Completed Date:', workOrder.completed_date ? new Date(workOrder.completed_date).toLocaleDateString() : (workOrder.completed_at ? new Date(workOrder.completed_at).toLocaleDateString() : 'N/A')]
        ];

        details.forEach(([label, value]) => {
            checkPageBreak(7);
            doc.setFont(undefined, 'bold');
            doc.text(label, margin, yPos);
            doc.setFont(undefined, 'normal');
            // Ensure value doesn't overflow
            const valueText = String(value || 'N/A');
            const maxValueWidth = pageWidth - margin - 70;
            const valueLines = doc.splitTextToSize(valueText, maxValueWidth);
            valueLines.forEach((line, index) => {
                doc.text(line, margin + 60, yPos + (index * 5));
            });
            yPos += 7 + ((valueLines.length - 1) * 5);
        });

        yPos += 5;

        // Asset Information
        if (workOrder.assets) {
            checkPageBreak(20);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Asset Information', margin, yPos);
            yPos += 7;

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setFont(undefined, 'bold');
            doc.text('Asset Name:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(workOrder.assets.name || 'N/A', margin + 40, yPos);
            yPos += 7;

            doc.setFont(undefined, 'bold');
            doc.text('Serial Number:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(workOrder.assets.serial_number || 'N/A', margin + 40, yPos);
            yPos += 10;
        }

        // Customer Information
        if (workOrder.customers && workOrder.customers.length > 0) {
            checkPageBreak(15);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Customer Information', margin, yPos);
            yPos += 7;

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setFont(undefined, 'bold');
            doc.text('Customer:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(workOrder.customers[0].name || 'N/A', margin + 30, yPos);
            yPos += 10;
        }

        // Assigned Technician
        if (workOrder.technicians) {
            checkPageBreak(15);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Assigned Technician', margin, yPos);
            yPos += 7;

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(workOrder.technicians.full_name || 'Unassigned', margin, yPos);
            yPos += 10;
        }

        // Description
        if (workOrder.description) {
            checkPageBreak(30);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Description', margin, yPos);
            yPos += 7;

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            const descriptionLines = doc.splitTextToSize(workOrder.description, contentWidth);
            descriptionLines.forEach(line => {
                checkPageBreak(7);
                doc.text(line, margin, yPos);
                yPos += 7;
            });
            yPos += 5;
        }

        // Parts Used Section
        if (parts && parts.length > 0) {
            checkPageBreak(40);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Parts Used', margin, yPos);
            yPos += 7;

            // Table header
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.text('Part Number', margin, yPos);
            doc.text('Description', margin + 40, yPos);
            doc.text('Qty', margin + 100, yPos);
            doc.text('Unit Cost', margin + 115, yPos);
            doc.text('Total', margin + 145, yPos);
            yPos += 5;
            
            // Draw header underline
            doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);

            // Draw line
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 3;

            let partsTotal = 0;
            doc.setFont(undefined, 'normal');
            parts.forEach(part => {
                checkPageBreak(10);
                const partInfo = part.parts || {};
                const quantity = part.quantity_used || 0;
                const unitCost = parseFloat(part.unit_cost || 0);
                const lineTotal = quantity * unitCost;
                partsTotal += lineTotal;

                doc.setFontSize(8);
                doc.text(partInfo.part_number || 'N/A', margin, yPos);
                doc.text((partInfo.name || 'Unknown').substring(0, 30), margin + 40, yPos);
                doc.text(quantity.toString(), margin + 100, yPos);
                doc.text(`$${unitCost.toFixed(2)}`, margin + 115, yPos);
                doc.text(`$${lineTotal.toFixed(2)}`, margin + 145, yPos);
                yPos += 6;
            });

            // Parts subtotal
            checkPageBreak(10);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 5;
            doc.setFont(undefined, 'bold');
            doc.text('Parts Subtotal:', margin + 100, yPos);
            doc.text(`$${partsTotal.toFixed(2)}`, margin + 145, yPos);
            yPos += 10;
        }

        // Labor Costs Section
        if (labor && labor.length > 0) {
            checkPageBreak(40);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Labor Costs', margin, yPos);
            yPos += 7;

            // Table header
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.text('Technician', margin, yPos);
            doc.text('Hours', margin + 60, yPos);
            doc.text('Rate', margin + 85, yPos);
            doc.text('Total', margin + 145, yPos);
            yPos += 5;
            
            // Draw header underline
            doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
            yPos += 3;

            let laborTotal = 0;
            doc.setFont(undefined, 'normal');
            labor.forEach(lab => {
                checkPageBreak(10);
                const techName = lab.technicians?.full_name || 'Unknown';
                // Fix: use 'hours' field, not 'hours_worked'
                const hours = parseFloat(lab.hours || lab.hours_worked || 0);
                const rate = parseFloat(lab.hourly_rate || 0);
                const lineTotal = hours * rate;
                laborTotal += lineTotal;

                doc.setFontSize(8);
                doc.text(techName.substring(0, 30), margin, yPos);
                doc.text(hours.toFixed(2), margin + 60, yPos);
                doc.text(`$${rate.toFixed(2)}`, margin + 85, yPos);
                doc.text(`$${lineTotal.toFixed(2)}`, margin + 145, yPos);
                yPos += 6;
            });

            checkPageBreak(10);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 5;
            doc.setFont(undefined, 'bold');
            doc.text('Labor Subtotal:', margin + 100, yPos);
            doc.text(`$${laborTotal.toFixed(2)}`, margin + 145, yPos);
            yPos += 10;
        }

        // Additional Costs Section
        if (additionalCosts && additionalCosts.length > 0) {
            checkPageBreak(40);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Additional Costs', margin, yPos);
            yPos += 7;

            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.text('Description', margin, yPos);
            doc.text('Amount', margin + 145, yPos);
            yPos += 5;
            
            // Draw header underline
            doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
            yPos += 3;

            let additionalTotal = 0;
            doc.setFont(undefined, 'normal');
            additionalCosts.forEach(cost => {
                checkPageBreak(10);
                const amount = parseFloat(cost.amount || 0);
                additionalTotal += amount;

                doc.setFontSize(8);
                doc.text((cost.description || 'N/A').substring(0, 50), margin, yPos);
                doc.text(`$${amount.toFixed(2)}`, margin + 145, yPos);
                yPos += 6;
            });

            checkPageBreak(10);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 5;
            doc.setFont(undefined, 'bold');
            doc.text('Additional Costs Subtotal:', margin + 100, yPos);
            doc.text(`$${additionalTotal.toFixed(2)}`, margin + 145, yPos);
            yPos += 10;
        }

        // Total Cost
        checkPageBreak(15);
        const partsTotal = parts?.reduce((sum, p) => sum + (parseFloat(p.quantity_used || 0) * parseFloat(p.unit_cost || 0)), 0) || 0;
        // Fix: use 'hours' field, not 'hours_worked'
        const laborTotal = labor?.reduce((sum, l) => sum + (parseFloat(l.hours || l.hours_worked || 0) * parseFloat(l.hourly_rate || 0)), 0) || 0;
        const additionalTotal = additionalCosts?.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0;
        const grandTotal = partsTotal + laborTotal + additionalTotal;

        // Draw separator line before total
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;
        
        // Total Cost - larger and bold
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('TOTAL COST:', margin + 100, yPos);
        doc.setFontSize(16);
        doc.text(`$${grandTotal.toFixed(2)}`, margin + 145, yPos);
        
        // Draw underline for emphasis
        yPos += 2;
        doc.line(margin + 100, yPos, pageWidth - margin, yPos);

        // Footer
        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.text(
                `Page ${i} of ${totalPages} | Generated: ${new Date().toLocaleString()}`,
                margin,
                pageHeight - 10
            );
        }

        // Save PDF
        const fileName = `Work_Order_${workOrder.work_order_number || workOrder.id}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        if (typeof showToast === 'function') {
            showToast('PDF report generated successfully', 'success');
        }
    } catch (error) {
        console.error('Error generating PDF:', error);
        if (typeof showToast === 'function') {
            showToast(`Failed to generate PDF: ${error.message}`, 'error');
        } else {
            alert(`Failed to generate PDF: ${error.message}`);
        }
    }
}

// Make function globally available
window.generateWorkOrderPDF = generateWorkOrderPDF;
