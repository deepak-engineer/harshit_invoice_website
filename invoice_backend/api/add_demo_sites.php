<?php
require_once 'db.php';

$sites = [
    ["HDFC phase 4", "6503", "SHYAMAL RD, AHMEDABAD", "Gujarat", "Ahmedabad", "Ground Floor Shop No. 1 & 2, Sun Avenue One, Manekbaug Shyamal Road, Satellite, Ahmedabad"],
    ["HDFC phase 4", "6530", "MAKARBA, AHMEDABAD", "Gujarat", "Ahmedabad", "Shop No-1 & 1St Floor,Shop No-10, Richmond Grand, Nr.Torrent Power Sub Station, Makarba Road, Ahmedabad- 380051."],
    ["HDFC phase 4", "956", "BAVLA, AHMEDABAD", "Gujarat", "Ahmedabad", "Hdfc Bank Ltd., Shop. No 11 To 18, Ground Floor, Zaveri Bazar,Geb Substation Road,Ahmedabad, Gujarat"],
    ["HDFC phase 4", "7835", "SKY LIGHTS, BOPAL, AHMEDABAD", "Gujarat", "Ahmedabad", "Hdfc Bank Ltd., Ground Floor, 5, 6 & 7, Maruti Skylights, Near Baps Swaminarayan Temple, Near Iscon Platinum, S. P. Ring Road, Bopal, Ahmedabad - 380058, Gujarat, India"],
    ["HDFC phase 4", "305", "BOPAL", "Gujarat", "Ahmedabad", "Samarpan Complex, 200Ft, Ring Road, Bopal Junction, Ahmedabad, Gujarat"],
    ["HDFC phase 4", "8684", "MORAIYA, SANAND", "Gujarat", "Ahmedabad", "Hdfc Bank Ltd.Shop No.3, Ground Floor, Daffodils Avenue, Besides Zydus Research Center, Changodar-Moraiya Road, Ahmedabad"],
    ["HDFC phase 4", "8071", "PARIMAL GARDEN , ELLIS BRIDGE", "Gujarat", "Ahmedabad", "Hdfc Bank Ltd., Grd. Floor, Shop No: 5 & 6, Anam-1, Parimal Garden Cross Road, Dist. Ahmedabad, Gujarat"],
    ["HDFC phase 4", "7832", "SCIENCE CITY - II, AHMEDABAD", "Gujarat", "Ahmedabad", "Hdfc Bank Ltd, Grd. Floor, Shop No.1 And 2 , Fortune Business Hub , Science City Road, Ahmedabad , Gujarat"],
    ["HDFC phase 4", "8702", "ISCON AMBLI ROAD", "Gujarat", "Ahmedabad", "Hdfc Bank Ltd., Grd. Floor, Shop No. 4, Palak Prime, Iscon Ambli Road, Opp. Hotel Double Tree By Hilton, Ahmedabad, Gujarat - 380058."],
    ["HDFC phase 4", "6638", "SECIENCE CITY - III", "Gujarat", "Ahmedabad", "Hdfc Bank Ltd, Grd. Floor, Shop No.3,City Centre 2, Science City Road,Near Shukan Mall, Ahmedabad - 380060"],
    ["HDFC phase 4", "5387", "VIRAMGAM, AHMEDABAD", "Gujarat", "Ahmedabad", "Ground Floor - Shop No. 21 & 22, Avadh City, Opp. Iti Road, Viramgam Bechraji Road, Gujarat"],
    ["HDFC phase 4", "7448", "KHOKHRA", "Gujarat", "Ahmedabad", "Shop Number 27 To 31 Sharnam Estate-4,Behind Anupam Cinema, Opp. Ashima Mill, Khokhra, Ahmedabad 380021"],
    ["HDFC phase 4", "7980", "SINDHU BHAVAN ROAD", "Gujarat", "Ahmedabad", "Ground Floor Shop No. 1 & 2, Shilp Satved, Near Sindhu Bhavan, Ahmedabad"],
    ["HDFC phase 4", "7445", "NARANPURA SPORTS COMPLEX, AHMEDABAD", "Gujarat", "Ahmedabad", "Hdfc Bank Ltd. Naranpura Sports Complex, Ground Floor ,Shop No 15 To 18 , Swarnik Arcade, Nr Arjun Tower, Naranpura, Ahmedabad."],
    ["HDFC phase 4", "7450", "BHAKTI CIRCLE, NIKOL", "Gujarat", "Ahmedabad", "Hdfc Bank Ltd. Ground Floor, Shop No. 19 To 23 , Hilltown Residency, Near Bhakti Circle, Nikol, Ahmedabad, Gujarat, India - 382350"],
    ["HDFC phase 4", "1675", "SUBHASH CHOWK, MEMNAGAR", "Gujarat", "Ahmedabad", "Hdfc Bank Ltd., Ground Floor Shop No: 11-13, Sanskrit Galleria, Near Subhash Chowk, Memnagar, Ahmedabad"],
    ["HDFC phase 4", "6520", "MALABAR COUNTY, AHMADABAD", "Gujarat", "Ahmedabad", "Hdfc Bank Ltd. Shop No 18-24, Malabar County-2. Malabar County Rd, B/H, Nirma University, S G Highway, Ahmedabad"],
    ["HDFC phase 4", "7614", "BHUYANDEV RD, AHMADABAD", "Gujarat", "Ahmedabad", "Hdfc Bank Ltd, Ground Floor, Shop No 16, Solaris Business Hub , Sola Road, Ahmedabad , Gujarat - 380013"],
    ["HDFC phase 4", "6453", "SANDESH PRESS ROAD, AHMADABAD", "Gujarat", "Ahmedabad", "Hdfc Bank Ltd., Ground Floor, Shop No. 7 & 8, Akshar Square, Sandesh Press Road, Bodakdev, Ahmedabad, Gujarat - 380054"],
    ["HDFC phase 4", "6549", "KHADIA", "Gujarat", "Ahmedabad", "Hdfc Bank Ltd. Grd. & Mezz. Floor, 401 Amratlal Pole, Opp. Khadia Golwad, Khadia, Dist. Ahmedabad, Gujarat - 380001."],
    ["HDFC phase 4", "8780", "DHANDHUKA", "Gujarat", "Ahmedabad", "Hdfc Bank Ltd., Grd. Floor, Shop No. 1-5, 5/A, Krushnabaug Society, Near Hero Showroom, Opp. Taluka Panchayat Office, Dhandhuka, Dist. Ahmedabad, Gujarat - 382460."],
    ["HDFC phase 4", "2441", "RATANANJALI SQUARE (PRERNATIRTH)", "Gujarat", "Ahmedabad", "G 07, Ground Floor, Ratnanjali Square, Nr. Gloria Restaurant, Prernatirth Derasar Road, Satellite, Ahmedabad, Gujarat"],
    ["HDFC phase 4", "8860", "SHELA - II", "Gujarat", "Ahmedabad", "Hdfc Bank Ltd., Grd. Floor, Shop No. 9 To 12A, Sun Shela One, Opp. Shanti Asiatic School, Shela (Tp-3), Sanand, Dist. Ahmedabad, Gujarat - 380058."],
    ["HDFC phase 4", "6568", "PRERNATIRTH 2, AHMEDABAD", "Gujarat", "Ahmedabad", "Hdfc Bank Ltd.Ground Floor, Kalatirth Apartment, Opp. Prernatirth Derasar, Jodhpur Satellite, Ahmedabad, Gujarat - 380015"],
    ["HDFC phase 4", "6407", "GODREJ GARDEN CITY", "Gujarat", "Ahmedabad", "Hdfc Bank Ltd., Grd. Floor, Shop No. 3, 4 & 5, City Square, Godrej Garden City, Dist. Ahmedabad, Gujarat - 382470."],
    ["HDFC phase 4", "783", "BODAKDEV, PLATINUM PLAZA, AHMEDABAD", "Gujarat", "Ahmedabad", "Hdfc Bank Ltd. 31 & 34, Platinum Plaza, Opp. Ioc Petrol Pump, Judges Bungalow Road, Bodakdev, Ahmedabad"],
    ["HDFC phase 4", "49", "BODAKDEV", "Gujarat", "Ahmedabad", "Hdfc Bank Ltd, Sumangalam Co-Op Hsg Society, Opp.Drive-In-Theatre, Bodakdeo, Ahmedabad, Gujarat"],
    ["HDFC phase 4", "4289", "KATHWADA, AHMEDABAD", "Gujarat", "Ahmedabad", "Shop No.42 To 45 , Siddhivinayak Arcade, Sp Ring Road, Odhav Kathwada, Ahmedabad, Gujarat"],
    ["HDFC phase 4", "383", "NARANPURA", "Gujarat", "Ahmedabad", "Divya Sadbhav - Ground Floor, 6 Dipak Colony, Near Shankar Soc No1, Near Municipal Garden, Mirambika Rd, Ahmedabad, Gujarat"],
    ["HDFC phase 4", "1567", "PANCHAVATI CIRCLE, AHMEDABAD", "Gujarat", "Ahmedabad", "Gf Pancharatna, Panchavati Circle, C G Road Ahmedabad, Ahmedabad, Gujarat"],
    ["HDFC phase 4", "8797", "ROYAL CITY, DHOLKA", "Gujarat", "Ahmedabad", "Hdfc Bank Ltd.Royal City Business Park,Dholka, Gujarat-382225"]
];

$inserted = 0;
foreach ($sites as $site) {
    // Bank Name = $site[0]
    // ATM ID (Code) = $site[1]
    // Location (Name) = $site[2]
    // State = $site[3]
    // City = $site[4]
    // Address = $site[5]
    
    // Format Name as Location (Bank Name)
    $name = $site[2];
    $code = $site[1];
    $address = $site[5];
    $state = $site[3];
    $city = $site[4];

    $stmt = $pdo->prepare("SELECT id FROM sites WHERE code = ?");
    $stmt->execute([$code]);
    if (!$stmt->fetch()) {
        $insert = $pdo->prepare("INSERT INTO sites (name, code, address, state, city) VALUES (?, ?, ?, ?, ?)");
        $insert->execute([$name, $code, $address, $state, $city]);
        $inserted++;
    }
}

echo json_encode(["success" => true, "inserted" => $inserted]);
