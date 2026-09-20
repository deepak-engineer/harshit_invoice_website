<?php
require_once __DIR__ . '/../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\RichText\RichText;

function getAmountInWords(float $number) {
    $no = floor($number);
    $point = round($number - $no, 2) * 100;
    $hundred = null;
    $digits_1 = strlen($no);
    $i = 0;
    $str = array();
    $words = array('0' => '', '1' => 'One', '2' => 'Two',
        '3' => 'Three', '4' => 'Four', '5' => 'Five', '6' => 'Six',
        '7' => 'Seven', '8' => 'Eight', '9' => 'Nine',
        '10' => 'Ten', '11' => 'Eleven', '12' => 'Twelve',
        '13' => 'Thirteen', '14' => 'Fourteen',
        '15' => 'Fifteen', '16' => 'Sixteen', '17' => 'Seventeen',
        '18' => 'Eighteen', '19' => 'Nineteen', '20' => 'Twenty',
        '30' => 'Thirty', '40' => 'Forty', '50' => 'Fifty',
        '60' => 'Sixty', '70' => 'Seventy',
        '80' => 'Eighty', '90' => 'Ninety');
    $digits = array('', 'Hundred', 'Thousand', 'Lakh', 'Crore');
    while ($i < $digits_1) {
        $divider = ($i == 2) ? 10 : 100;
        $number = floor($no % $divider);
        $no = floor($no / $divider);
        $i += ($divider == 10) ? 1 : 2;
        if ($number) {
            $plural = (($counter = count($str)) && $number > 9) ? 's' : null;
            $hundred = ($counter == 1 && $str[0]) ? ' and ' : null;
            $str [] = ($number < 21) ? $words[$number] .
                " " . $digits[$counter] . $plural . " " . $hundred
                :
                $words[floor($number / 10) * 10]
                . " " . $words[$number % 10] . " "
                . $digits[$counter] . $plural . " " . $hundred;
        } else $str[] = null;
    }
    $str = array_reverse($str);
    $result = implode('', $str);
    $points = ($point) ?
        "." . $words[$point / 10] . " " .
        $words[$point = $point % 10] : '';
    return trim($result . "Rupees Only.");
}

function setRichText($sheet, $cell, $boldText, $normalText) {
    $richText = new RichText();
    $bold = $richText->createTextRun($boldText);
    $bold->getFont()->setBold(true);
    $richText->createText($normalText);
    $sheet->setCellValue($cell, $richText);
}

function generateExcel($invoice_id, $pdo, $format = 'excel') {
    $stmt = $pdo->prepare("SELECT i.*, v.name as vendor_name, v.address as vendor_address, v.email as vendor_email, v.pan_no as vendor_pan, v.bank_holder_name, v.bank_name, v.account_no, v.ifsc_code, v.bank_address, v.signature_image as vendor_signature, c.name as client_name, c.address as client_address FROM invoices i LEFT JOIN vendors v ON i.vendor_id = v.id LEFT JOIN clients c ON i.client_id = c.id WHERE i.id = ?");
    $stmt->execute([$invoice_id]);
    $invoice = $stmt->fetch();

    if (!$invoice) {
        http_response_code(404);
        echo json_encode(["error" => "Invoice not found"]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sr_no ASC");
    $stmt->execute([$invoice_id]);
    $items = $stmt->fetchAll();

    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();

    // Global padding, alignment and font
    $spreadsheet->getDefaultStyle()->getFont()->setName('Arial')->setSize(10);
    $spreadsheet->getDefaultStyle()->getAlignment()
        ->setVertical(Alignment::VERTICAL_CENTER)
        ->setHorizontal(Alignment::HORIZONTAL_LEFT)
        ->setIndent(1);

    // Columns A-F
    $sheet->getColumnDimension('A')->setWidth(6);
    $sheet->getColumnDimension('B')->setWidth(35);
    $sheet->getColumnDimension('C')->setWidth(25);
    $sheet->getColumnDimension('D')->setWidth(10);
    $sheet->getColumnDimension('E')->setWidth(15);
    $sheet->getColumnDimension('F')->setWidth(15);

    // Title
    $sheet->mergeCells('A1:F1');
    $sheet->setCellValue('A1', 'SERVICE BILL / INVOICE');
    $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14)->getColor()->setARGB('FFFFFFFF');
    $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
    $sheet->getStyle('A1:F1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF004F81');
    $sheet->getRowDimension(1)->setRowHeight(25);

    $v_address = trim(preg_replace('/\s+/', ' ', str_replace(["\r", "\n"], ", ", $invoice['vendor_address'])), ", ");
    $v_email = trim(preg_replace('/\s+/', ' ', str_replace(["\r", "\n"], " ", $invoice['vendor_email'])));

    // Vendor Block (A-C)
    $sheet->mergeCells('A2:C2');
    $sheet->setCellValue('A2', 'Vendor');
    $sheet->getStyle('A2')->getFont()->setBold(true);
    
    $sheet->mergeCells('A3:C3');
    setRichText($sheet, 'A3', 'Name: ', $invoice['vendor_name'] ?? '');
    
    $sheet->mergeCells('A4:C4');
    setRichText($sheet, 'A4', 'Address: ', $v_address);
    
    $sheet->mergeCells('A5:C5');
    setRichText($sheet, 'A5', 'Email: ', $v_email);
    
    $sheet->mergeCells('A6:C6');
    setRichText($sheet, 'A6', 'PAN NO: ', strtoupper($invoice['vendor_pan'] ?? ''));
    
    $sheet->getStyle('A2:A6')->getAlignment()->setWrapText(true)->setVertical(Alignment::VERTICAL_TOP);

    // Bill To Block (D-F)
    $c_address = trim(preg_replace('/\s+/', ' ', str_replace(["\r", "\n"], ", ", $invoice['client_address'])), ", ");
    $sheet->mergeCells('D2:F2');
    $sheet->setCellValue('D2', 'Bill To');
    $sheet->getStyle('D2')->getFont()->setBold(true);
    
    $sheet->mergeCells('D3:F3');
    setRichText($sheet, 'D3', 'Name: ', $invoice['client_name'] ?? '');
    
    $sheet->mergeCells('D4:F4');
    setRichText($sheet, 'D4', 'Address: ', $c_address);
    
    $sheet->mergeCells('D5:F5');
    setRichText($sheet, 'D5', 'Invoice No.: ', ($invoice['invoice_no'] ?? '') . '    Date: ' . date('d/m/Y', strtotime($invoice['invoice_date'])));
    
    $sheet->mergeCells('D6:F6');
    setRichText($sheet, 'D6', 'Payment Terms: ', $invoice['payment_terms'] ?? '');
    
    $sheet->getStyle('D2:D6')->getAlignment()->setWrapText(true)->setVertical(Alignment::VERTICAL_TOP);

    // Items Header
    $sheet->setCellValue('A7', 'Sr.');
    $sheet->setCellValue('B7', 'PROJECT DETAIL');
    $sheet->setCellValue('C7', 'Description');
    $sheet->setCellValue('D7', 'Qty.');
    $sheet->setCellValue('E7', 'Rate (Rs.)');
    $sheet->setCellValue('F7', 'Amount (Rs.)');
    $sheet->getStyle('A7:F7')->getFont()->setBold(true);
    $sheet->getStyle('A7:F7')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
    $sheet->getRowDimension(7)->setRowHeight(22);

    $row = 8;
    foreach ($items as $item) {
        $sheet->getRowDimension($row)->setRowHeight(60); 
        $sheet->setCellValue('A'.$row, $item['sr_no']);
        
        $projDetail = "Project / Site Details - " . ($item['project_site_details'] ?? '') . "\n";
        $projDetail .= "Client Project: " . ($item['client_project'] ?? '') . " | Site ID: " . ($item['site_id'] ?? '') . "\n";
        $projDetail .= "Location: " . ($item['location'] ?? '');
        $sheet->setCellValue('B'.$row, $projDetail);
        
        $sheet->setCellValue('C'.$row, $item['description']);
        $sheet->setCellValue('D'.$row, $item['qty']);
        $sheet->setCellValue('E'.$row, number_format($item['rate'], 2));
        $sheet->setCellValue('F'.$row, number_format($item['amount'], 2));
        
        $sheet->getStyle('A'.$row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('B'.$row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setWrapText(true);
        $sheet->getStyle('C'.$row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setWrapText(true);
        $sheet->getStyle('D'.$row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('E'.$row.':F'.$row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $row++;
    }

    $itemsEndRow = $row - 1;

    // Total
    $totalRow = $row;
    $sheet->getRowDimension($row)->setRowHeight(22);
    $sheet->mergeCells('A'.$row.':D'.$row);
    $sheet->setCellValue('E'.$row, 'Total');
    $sheet->setCellValue('F'.$row, number_format($invoice['total_amount'], 2));
    $sheet->getStyle('E'.$row.':F'.$row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
    $sheet->getStyle('E'.$row.':F'.$row)->getFont()->setBold(true);

    $row++;
    $amountWordsRow = $row;
    $amountInWords = $invoice['amount_in_words'] ?: getAmountInWords($invoice['total_amount']);
    $sheet->getRowDimension($row)->setRowHeight(20);
    $sheet->mergeCells('A'.$row.':F'.$row);
    setRichText($sheet, 'A'.$row, 'Amount in Words: ', $amountInWords);

    $row++;
    // Bank Details
    $bankHeaderRow = $row;
    $sheet->getRowDimension($row)->setRowHeight(20);
    $sheet->mergeCells('A'.$row.':F'.$row);
    setRichText($sheet, 'A'.$row, 'Bank / Payment Details Account Holder Name: ', $invoice['bank_holder_name']);
    
    $row++;
    $sheet->mergeCells('A'.$row.':F'.$row);
    $richText = new RichText();
    $b1 = $richText->createTextRun('Bank Name: '); $b1->getFont()->setBold(true);
    $richText->createText(($invoice['bank_name'] ?? '') . '   ');
    $b2 = $richText->createTextRun('Account No.: '); $b2->getFont()->setBold(true);
    $richText->createText(($invoice['account_no'] ?? '') . '   ');
    $b3 = $richText->createTextRun('IFSC Code: '); $b3->getFont()->setBold(true);
    $richText->createText($invoice['ifsc_code'] ?? '');
    $sheet->getRowDimension($row)->setRowHeight(20);
    $sheet->setCellValue('A'.$row, $richText);

    $row++;
    $bankAddressRow = $row;
    $sheet->mergeCells('A'.$row.':F'.$row);
    setRichText($sheet, 'A'.$row, 'Bank Address: ', $invoice['bank_address']);

    $row++;
    $sigHeaderRow = $row;
    $sheet->getRowDimension($row)->setRowHeight(20);
    $sheet->mergeCells('A'.$row.':C'.$row);
    $sheet->setCellValue('A'.$row, 'Vendor / Authorized Signatory');
    $sheet->getStyle('A'.$row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
    $sheet->getStyle('A'.$row)->getFont()->setBold(true);
    
    $sheet->mergeCells('D'.$row.':F'.$row);
    $sheet->setCellValue('D'.$row, 'Customer Acknowledgement');
    $sheet->getStyle('D'.$row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
    $sheet->getStyle('D'.$row)->getFont()->setBold(true);

    $row++;
    $sigSpaceRow = $row;
    $sheet->mergeCells('A'.$row.':C'.$row);
    $sheet->getRowDimension($row)->setRowHeight(70);
    $sheet->setCellValue('A'.$row, '');
    
    $row++;
    $sigLineRow = $row;
    $sheet->getRowDimension($row)->setRowHeight(20);
    $sheet->mergeCells('A'.$row.':C'.$row);
    $sheet->setCellValue('A'.$row, 'Signature: ______________________');
    $sheet->getStyle('A'.$row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
    
    $sheet->mergeCells('D'.$row.':F'.$row);
    $sheet->setCellValue('D'.$row, 'Signature: ______________________');
    $sheet->getStyle('D'.$row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

    // Signature Image
    $sigData = $invoice['signature_image'];
    if ($sigData === null) {
        $vStmt = $pdo->query("SELECT signature_image FROM vendors LIMIT 1");
        $vendorRow = $vStmt->fetch();
        $sigData = $vendorRow ? $vendorRow['signature_image'] : null;
    }

    $sigPath = null;
    $tempFiles = [];
    if (!empty($sigData)) {
        $parts = explode(',', $sigData);
        if (count($parts) == 2) {
            $decoded = base64_decode($parts[1]);
            if ($decoded !== false) {
                $sigPath = __DIR__ . '/sig_' . uniqid() . '.png';
                file_put_contents($sigPath, $decoded);
                $tempFiles[] = $sigPath;
            }
        }
    }

    if (file_exists($sigPath)) {
        $drawing = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
        $drawing->setName('Signature');
        $drawing->setDescription('Signature');
        $drawing->setPath($sigPath);
        $drawing->setCoordinates('B'.($row-1));
        $drawing->setOffsetY(10);
        $drawing->setOffsetX(0);
        $drawing->setHeight(65);
        $drawing->setWorksheet($sheet);
    }

    $row++;
    $termsHeaderRow = $row;
    $sheet->getRowDimension($row)->setRowHeight(20);
    $sheet->mergeCells('A'.$row.':F'.$row);
    $sheet->setCellValue('A'.$row, 'Terms & Conditions');
    $sheet->getStyle('A'.$row)->getFont()->setBold(true);

    $terms = json_decode($invoice['terms_conditions'] ?? '[]', true);
    if (empty($terms)) {
        $terms = [
            "This bill is raised for the services/charges mentioned above.",
            "Payment shall be made to the bank account details mentioned in this invoice.",
            "Any applicable taxes, statutory deductions, or withholding shall be dealt with as mutually agreed.",
            "Any discrepancy in this bill should be communicated to the vendor within 7 days.",
            "This invoice is subject to mutual confirmation of the services/charges."
        ];
    }
    
    foreach ($terms as $idx => $term) {
        $row++;
        $sheet->getRowDimension($row)->setRowHeight(18);
        $sheet->mergeCells('A'.$row.':F'.$row);
        $sheet->setCellValue('A'.$row, ($idx + 1) . '. ' . $term);
    }

    $row++;
    $sheet->mergeCells('A'.$row.':F'.$row);
    $sheet->setCellValue('A'.$row, 'Thank you for your business.');
    $sheet->getStyle('A'.$row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

    // Styling borders
    $styleOutline = [
        'borders' => [
            'outline' => [
                'borderStyle' => Border::BORDER_THIN,
            ],
        ],
    ];
    $styleAll = [
        'borders' => [
            'allBorders' => [
                'borderStyle' => Border::BORDER_THIN,
            ],
        ],
    ];

    $sheet->getStyle('A1:F1')->applyFromArray($styleOutline);
    $sheet->getStyle('A2:C6')->applyFromArray($styleOutline);
    $sheet->getStyle('D2:F6')->applyFromArray($styleOutline);
    
    $sheet->getStyle('A7:F7')->applyFromArray($styleAll);
    if ($itemsEndRow >= 8) {
        $sheet->getStyle('A8:F'.$itemsEndRow)->applyFromArray($styleAll); 
    }
    
    $sheet->getStyle('A'.$totalRow.':F'.$totalRow)->applyFromArray($styleOutline); 
    $sheet->getStyle('A'.$amountWordsRow.':F'.$amountWordsRow)->applyFromArray($styleOutline); 
    $sheet->getStyle('A'.$bankHeaderRow.':F'.$bankAddressRow)->applyFromArray($styleOutline);   
    $sheet->getStyle('A'.$sigHeaderRow.':F'.$sigLineRow)->applyFromArray($styleOutline);   
    $sheet->getStyle('A'.$termsHeaderRow.':F'.$row)->applyFromArray($styleOutline);       
    $sheet->getStyle('A1:F'.$row)->applyFromArray($styleOutline);

    // --- Page Setup for correct PDF saving from Excel (Hostinger friendly) ---
    $sheet->getPageSetup()->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_PORTRAIT);
    $sheet->getPageSetup()->setPaperSize(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::PAPERSIZE_A4);
    $sheet->getPageSetup()->setFitToPage(true);
    $sheet->getPageSetup()->setFitToWidth(1);
    $sheet->getPageSetup()->setFitToHeight(0);
    $sheet->getPageSetup()->setHorizontalCentered(true);
    
    $sheet->getPageMargins()->setTop(0.5);
    $sheet->getPageMargins()->setRight(0.25);
    $sheet->getPageMargins()->setLeft(0.25);
    $sheet->getPageMargins()->setBottom(0.5);

    if ($format === 'excel') {
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="Invoice_'.$invoice['invoice_no'].'.xlsx"');
        header('Cache-Control: max-age=0');
        $writer = new Xlsx($spreadsheet);
        $writer->save('php://output');
    }
    
    // Cleanup temp files
    foreach ($tempFiles as $f) {
        if (file_exists($f)) @unlink($f);
    }
}

function generatePdfDirect($invoice_id, $pdo) {
    $stmt = $pdo->prepare("SELECT i.*, v.name as vendor_name, v.address as vendor_address, v.email as vendor_email, v.pan_no as vendor_pan, v.bank_holder_name, v.bank_name, v.account_no, v.ifsc_code, v.bank_address, v.signature_image as vendor_signature, c.name as client_name, c.address as client_address FROM invoices i LEFT JOIN vendors v ON i.vendor_id = v.id LEFT JOIN clients c ON i.client_id = c.id WHERE i.id = ?");
    $stmt->execute([$invoice_id]);
    $invoice = $stmt->fetch();

    if (!$invoice) {
        http_response_code(404);
        echo json_encode(["error" => "Invoice not found"]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sr_no ASC");
    $stmt->execute([$invoice_id]);
    $items = $stmt->fetchAll();

    $terms = json_decode($invoice['terms_conditions'], true) ?: [];
    $vendor_address = trim(preg_replace('/\s+/', ' ', str_replace(["\r", "\n"], ", ", $invoice['vendor_address'])), ", ");
    $client_address = trim(preg_replace('/\s+/', ' ', str_replace(["\r", "\n"], ", ", $invoice['client_address'])), ", ");

    $sigData = $invoice['signature_image'];
    if ($sigData === null) {
        $vStmt = $pdo->query("SELECT signature_image FROM vendors LIMIT 1");
        $vendorRow = $vStmt->fetch();
        $sigData = $vendorRow ? $vendorRow['signature_image'] : null;
    }
    
    $sigImgTag = '';
    if (!empty($sigData)) {
        $sigImgTag = '<img src="'.$sigData.'" style="height:60px; max-width:200px;" />';
    }

    $amountInWords = $invoice['amount_in_words'] ?: getAmountInWords($invoice['total_amount']);
    $dateFormatted = date('d/m/Y', strtotime($invoice['invoice_date']));

    $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page {
            margin: 8mm;
        }
        body {
            font-family: Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #000;
            margin: 0;
            padding: 0;
            line-height: 1.4;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        td, th {
            border: 1px solid #000;
            padding: 6px;
            vertical-align: top;
        }
        .header-title {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
            padding: 8px;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .fw-bold { font-weight: bold; }
        .mt-2 { margin-top: 10px; }
        .mb-2 { margin-bottom: 10px; }
    </style>
</head>
<body>
    <table>
        <tr>
            <td colspan="6" class="header-title">SERVICE BILL / INVOICE</td>
        </tr>
        <tr>
            <td colspan="3">
                <div class="text-left" style="padding-left: 5px;">
                    <div class="fw-bold" style="font-size: 13px; margin-bottom: 5px;">Vendor</div>
                    <div style="margin-bottom: 5px; font-size: 12px;">'.htmlspecialchars($invoice['vendor_name'] ?? '').'</div>
                    <div>Address: '.htmlspecialchars($vendor_address).'</div>
                    <div>Contact No- </div>
                    <div>Email Id- '.htmlspecialchars($invoice['vendor_email'] ?? '').'</div>
                    <div>PAN- '.htmlspecialchars($invoice['vendor_pan'] ?? '').'</div>
                </div>
            </td>
            <td colspan="3">
                <div class="text-left" style="padding-left: 5px;">
                    <div class="fw-bold" style="font-size: 13px; margin-bottom: 5px;">Bill To</div>
                    <div style="margin-bottom: 5px; font-size: 12px;">'.htmlspecialchars($invoice['client_name'] ?? '').'</div>
                    <div>'.htmlspecialchars($client_address).'</div>
                    <div class="mt-2" style="margin-top: 15px;">Invoice No.: '.htmlspecialchars($invoice['invoice_no']).' Date: '.htmlspecialchars($dateFormatted).'</div>
                    <div>Payment Terms: '.htmlspecialchars($invoice['payment_terms']).'</div>
                </div>
            </td>
        </tr>
        <tr>
            <th style="width: 5%;">Sr.</th>
            <th style="width: 35%;">PROJECT DETAIL</th>
            <th style="width: 25%;">Description</th>
            <th style="width: 8%;">Qty.</th>
            <th style="width: 12%;">Rate (Rs.)</th>
            <th style="width: 15%;">Amount (Rs.)</th>
        </tr>';
        
    foreach ($items as $idx => $item) {
        $html .= '<tr>
            <td class="text-center">'.($idx+1).'</td>
            <td>
                <div style="font-size: 10px; padding: 2px;">
                    <div class="text-center mb-2">Project / Site Details - '.htmlspecialchars($item['project_site_details'] ?? '').'</div>
                    <div class="text-center mb-2">Client Project: '.htmlspecialchars($item['client_project'] ?? '').' &nbsp;|&nbsp; Site ID: '.htmlspecialchars($item['site_id'] ?? '').'</div>
                    <div class="text-center">Location: '.htmlspecialchars($item['location'] ?? '').'</div>
                </div>
            </td>
            <td class="text-center" style="vertical-align: middle;">'.htmlspecialchars($item['description']).'</td>
            <td class="text-center" style="vertical-align: middle;">'.htmlspecialchars($item['qty']).'</td>
            <td class="text-center" style="vertical-align: middle;">'.number_format($item['rate'], 2).'</td>
            <td class="text-center" style="vertical-align: middle;">'.number_format($item['amount'], 2).'</td>
        </tr>';
    }
    
    $html .= '
        <tr>
            <td colspan="4"></td>
            <td class="fw-bold text-center">Total</td>
            <td class="fw-bold text-center">'.number_format($invoice['total_amount'], 2).'</td>
        </tr>
        <tr>
            <td colspan="6">Amount in Words: <b>'.htmlspecialchars($amountInWords).'</b></td>
        </tr>
        <tr>
            <td colspan="6">
                <div class="mb-2">Bank / Payment Details Account Holder Name: '.htmlspecialchars($invoice['bank_holder_name']).'</div>
                <div class="mb-2">Bank Name: '.htmlspecialchars($invoice['bank_name']).' &nbsp;&nbsp;&nbsp;&nbsp; Account No.: '.htmlspecialchars($invoice['account_no']).' &nbsp;&nbsp;&nbsp;&nbsp; IFSC Code: '.htmlspecialchars($invoice['ifsc_code']).'</div>
                <div>Bank Address: '.htmlspecialchars($invoice['bank_address']).'</div>
            </td>
        </tr>
        <tr>
            <td colspan="3">
                <div class="text-center fw-bold" style="margin-bottom: 40px;">Vendor / Authorized Signatory</div>
                <div class="text-center">'.$sigImgTag.'</div>
                <div class="text-center" style="margin-top: 10px;">Signature: ______________________</div>
                <div class="mt-2 text-center">'.htmlspecialchars(strtoupper($invoice['vendor_name'] ?? '')).'</div>
            </td>
            <td colspan="3">
                <div class="text-center fw-bold" style="margin-bottom: 40px;">Customer Acknowledgement</div>
                <div style="height: 60px;"></div>
                <div class="text-center" style="margin-top: 10px;">Signature: ______________________</div>
            </td>
        </tr>
        <tr>
            <td colspan="6">
                <div class="fw-bold mb-2">Terms & Conditions</div>
                <div>
                    <ol style="margin: 0; padding-left: 20px; font-size: 10px;">';
    foreach ($terms as $idx => $term) {
        $html .= '<li style="margin-bottom: 4px;">'.htmlspecialchars($term).'</li>';
    }
    $html .= '      </ol>
                </div>
            </td>
        </tr>
        <tr>
            <td colspan="6" class="text-center" style="padding: 10px;">Thank you for your business.</td>
        </tr>
    </table>
</body>
</html>';

    $dompdf = new \Dompdf\Dompdf();
    $options = $dompdf->getOptions();
    $options->set('isRemoteEnabled', true);
    $options->set('defaultFont', 'Helvetica');
    $dompdf->setOptions($options);
    $dompdf->loadHtml($html);
    
    // Calculate required height to fit everything on a single page
    // Base height for headers, footers, terms: ~500px
    // Height per item: ~80px
    $calculatedHeight = 500 + (count($items) * 80);
    // Minimum height is A4 (842 points)
    $pageHeight = max(842, $calculatedHeight);
    
    // Set custom paper size: width A4 (595.28 pt), height dynamic
    $dompdf->setPaper(array(0, 0, 595.28, $pageHeight), 'portrait');
    
    $dompdf->render();

    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment;filename="Invoice_'.$invoice['invoice_no'].'.pdf"');
    header('Cache-Control: max-age=0');
    echo $dompdf->output();
    exit;
}
?>
