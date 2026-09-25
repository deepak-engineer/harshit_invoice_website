<?php
require_once 'api/db.php';

$data = <<<EOT
HDFC phase 4	6503	#N/A	SHYAMAL RD, AHMEDABAD	Gujarat	Ahmedabad	Ground Floor Shop No. 1 & 2, Sun Avenue One, Manekbaug Shyamal Road, Satellite, Ahmedabad	West	AnG India Ltd
HDFC phase 4	6530	#N/A	MAKARBA, AHMEDABAD	Gujarat	Ahmedabad	Shop No-1 & 1St Floor,Shop No-10, Richmond Grand, Nr.Torrent Power Sub Station, Makarba Road, Ahmedabad- 380051.	West	AnG India Ltd
HDFC phase 4	956	#N/A	BAVLA, AHMEDABAD	Gujarat	Ahmedabad	Hdfc Bank Ltd., Shop. No 11 To 18, Ground Floor, Zaveri Bazar,Geb Substation Road,Ahmedabad, Gujarat	West	AnG India Ltd
HDFC phase 4	7835	#N/A	SKY LIGHTS, BOPAL, AHMEDABAD	Gujarat	Ahmedabad	Hdfc Bank Ltd., Ground Floor, 5, 6 & 7, Maruti Skylights, Near Baps Swaminarayan Temple, Near Iscon Platinum, S. P. Ring Road, Bopal, Ahmedabad - 380058, Gujarat, India	West	AnG India Ltd
HDFC phase 4	305	#N/A	BOPAL	Gujarat	Ahmedabad	Samarpan Complex, 200Ft, Ring Road, Bopal Junction, Ahmedabad, Gujarat	West	AnG India Ltd
HDFC phase 4	8684	#N/A	MORAIYA, SANAND	Gujarat	Ahmedabad	Hdfc Bank Ltd.Shop No.3, Ground Floor, Daffodils Avenue, Besides Zydus Research Center, Changodar-Moraiya Road, Ahmedabad	West	AnG India Ltd
HDFC phase 4	8071	#N/A	PARIMAL GARDEN , ELLIS BRIDGE	Gujarat	Ahmedabad	Hdfc Bank Ltd., Grd. Floor, Shop No: 5 & 6, Anam-1, Parimal Garden Cross Road, Dist. Ahmedabad, Gujarat	West	AnG India Ltd
HDFC phase 4	7832	#N/A	SCIENCE CITY - II, AHMEDABAD	Gujarat	Ahmedabad	Hdfc Bank Ltd, Grd. Floor, Shop No.1 And 2 , Fortune Business Hub , Science City Road, Ahmedabad , Gujarat	West	AnG India Ltd
HDFC phase 4	8702	#N/A	ISCON AMBLI ROAD	Gujarat	Ahmedabad	Hdfc Bank Ltd., Grd. Floor, Shop No. 4, Palak Prime, Iscon Ambli Road, Opp. Hotel Double Tree By Hilton, Ahmedabad, Gujarat - 380058.	West	AnG India Ltd
HDFC phase 4	6638	#N/A	SECIENCE CITY - III	Gujarat	Ahmedabad	Hdfc Bank Ltd, Grd. Floor, Shop No.3,City Centre 2, Science City Road,Near Shukan Mall, Ahmedabad - 380060	West	AnG India Ltd
HDFC phase 4	5387	#N/A	VIRAMGAM, AHMEDABAD	Gujarat	Ahmedabad	Ground Floor - Shop No. 21 & 22, Avadh City, Opp. Iti Road, Viramgam Bechraji Road, Gujarat	West	AnG India Ltd
HDFC phase 4	7448	#N/A	KHOKHRA	Gujarat	Ahmedabad	Shop Number 27 To 31 Sharnam Estate-4,Behind Anupam Cinema, Opp. Ashima Mill, Khokhra, Ahmedabad 380021	West	AnG India Ltd
HDFC phase 4	7980	#N/A	SINDHU BHAVAN ROAD	Gujarat	Ahmedabad	Ground Floor Shop No. 1 & 2, Shilp Satved, Near Sindhu Bhavan, Ahmedabad	West	AnG India Ltd
HDFC phase 4	7445	#N/A	NARANPURA SPORTS COMPLEX, AHMEDABAD	Gujarat	Ahmedabad	Hdfc Bank Ltd. Naranpura Sports Complex, Ground Floor ,Shop No 15 To 18 , Swarnik Arcade, Nr Arjun Tower, Naranpura, Ahmedabad.	West	AnG India Ltd
HDFC phase 4	7450	#N/A	BHAKTI CIRCLE, NIKOL	Gujarat	Ahmedabad	Hdfc Bank Ltd. Ground Floor, Shop No. 19 To 23 , Hilltown Residency, Near Bhakti Circle, Nikol, Ahmedabad, Gujarat, India - 382350	West	AnG India Ltd
HDFC phase 4	1675	#N/A	SUBHASH CHOWK, MEMNAGAR	Gujarat	Ahmedabad	Hdfc Bank Ltd., Ground Floor Shop No: 11-13, Sanskrit Galleria, Near Subhash Chowk, Memnagar, Ahmedabad	West	AnG India Ltd
HDFC phase 4	6520	#N/A	MALABAR COUNTY, AHMADABAD	Gujarat	Ahmedabad	Hdfc Bank Ltd. Shop No 18-24, Malabar County-2. Malabar County Rd, B/H, Nirma University, S G Highway, Ahmedabad	West	AnG India Ltd
HDFC phase 4	7614	#N/A	BHUYANDEV RD, AHMADABAD	Gujarat	Ahmedabad	Hdfc Bank Ltd, Ground Floor, Shop No 16, Solaris Business Hub , Sola Road, Ahmedabad , Gujarat - 380013	West	AnG India Ltd
HDFC phase 4	6453	#N/A	SANDESH PRESS ROAD, AHMADABAD	Gujarat	Ahmedabad	Hdfc Bank Ltd., Ground Floor, Shop No. 7 & 8, Akshar Square, Sandesh Press Road, Bodakdev, Ahmedabad, Gujarat - 380054	West	AnG India Ltd
HDFC phase 4	6549	#N/A	KHADIA	Gujarat	Ahmedabad	Hdfc Bank Ltd. Grd. & Mezz. Floor, 401 Amratlal Pole, Opp. Khadia Golwad, Khadia, Dist. Ahmedabad, Gujarat - 380001.	West	AnG India Ltd
HDFC phase 4	8780	#N/A	DHANDHUKA	Gujarat	Ahmedabad	Hdfc Bank Ltd., Grd. Floor, Shop No. 1-5, 5/A, Krushnabaug Society, Near Hero Showroom, Opp. Taluka Panchayat Office, Dhandhuka, Dist. Ahmedabad, Gujarat - 382460.	West	AnG India Ltd
HDFC phase 4	2441	#N/A	RATANANJALI SQUARE (PRERNATIRTH)	Gujarat	Ahmedabad	G 07, Ground Floor, Ratnanjali Square, Nr. Gloria Restaurant, Prernatirth Derasar Road, Satellite, Ahmedabad, Gujarat	West	AnG India Ltd
HDFC phase 4	8860	#N/A	SHELA - II	Gujarat	Ahmedabad	Hdfc Bank Ltd., Grd. Floor, Shop No. 9 To 12A, Sun Shela One, Opp. Shanti Asiatic School, Shela (Tp-3), Sanand, Dist. Ahmedabad, Gujarat - 380058.	West	AnG India Ltd
HDFC phase 4	6568	#N/A	PRERNATIRTH 2, AHMEDABAD	Gujarat	Ahmedabad	Hdfc Bank Ltd.Ground Floor, Kalatirth Apartment, Opp. Prernatirth Derasar, Jodhpur Satellite, Ahmedabad, Gujarat - 380015	West	AnG India Ltd
HDFC phase 4	6407	#N/A	GODREJ GARDEN CITY	Gujarat	Ahmedabad	Hdfc Bank Ltd., Grd. Floor, Shop No. 3, 4 & 5, City Square, Godrej Garden City, Dist. Ahmedabad, Gujarat - 382470.	West	AnG India Ltd
HDFC phase 4	783	#N/A	BODAKDEV, PLATINUM PLAZA, AHMEDABAD	Gujarat	Ahmedabad	Hdfc Bank Ltd. 31 & 34, Platinum Plaza, Opp. Ioc Petrol Pump, Judges Bungalow Road, Bodakdev, Ahmedabad	West	AnG India Ltd
HDFC phase 4	49	#N/A	BODAKDEV	Gujarat	Ahmedabad	Hdfc Bank Ltd, Sumangalam Co-Op Hsg Society, Opp.Drive-In-Theatre, Bodakdeo, Ahmedabad, Gujarat	West	AnG India Ltd
HDFC phase 4	4289	#N/A	KATHWADA, AHMEDABAD	Gujarat	Ahmedabad	Shop No.42 To 45 , Siddhivinayak Arcade, Sp Ring Road, Odhav Kathwada, Ahmedabad, Gujarat	West	AnG India Ltd
HDFC phase 4	383	#N/A	NARANPURA	Gujarat	Ahmedabad	Divya Sadbhav - Ground Floor, 6 Dipak Colony, Near Shankar Soc No1, Near Municipal Garden, Mirambika Rd, Ahmedabad, Gujarat	West	AnG India Ltd
HDFC phase 4	1567	#N/A	PANCHAVATI CIRCLE, AHMEDABAD	Gujarat	Ahmedabad	Gf Pancharatna, Panchavati Circle, C G Road Ahmedabad, Ahmedabad, Gujarat	West	AnG India Ltd
HDFC phase 4	8797	#N/A	ROYAL CITY, DHOLKA	Gujarat	Ahmedabad	Hdfc Bank Ltd.Royal City Business Park,Dholka, Gujarat-382225	West	AnG India Ltd
HDFC phase 4	7000	#N/A	MARIGOLD CIRCLE, AHMEDABAD	Gujarat	Ahmedabad	Hdfc Bank Ltd., Ground. Floor, Shop Number 54,55 And 56,Shaligram, Opp. Marigold, Ghuma, Ahmedabad	West	AnG India Ltd
HDFC phase 4	9740	#N/A	GALA GYMKHANA RD. AHMEDABAD, SOUTH BOPAL	Gujarat	Ahmedabad	Hdfc Bank Ltd. Sun South Tradeopp Kavisha Celebration Centre,Gala Gymkhana Road, South Bopal Ahmedabad	West	AnG India Ltd
HDFC phase 4	1285	#N/A	JODHPUR CROSS ROAD, AHMEDABAD	Gujarat	Ahmedabad	Ground Floor, Iscon Park, Opp Star India Bazaar, Jodhpur Cross Roads, Ahmedabad, Gujarat	West	AnG India Ltd
HDFC phase 4	8812	#N/A	SHALIGRAM SQUARE, GOTA, AHMEDABAD	Gujarat	Ahmedabad	Hdfc Bank Ltd. Near Satyamev Vista, Off S.G Highway,Shukan Glory Road, Ahmedabad	West	AnG India Ltd
HDFC phase 4	8210	#N/A	CHANDKHEDA NIGAM NAGAR, AHMEDABAD	Gujarat	Ahmedabad	Hdfc Bank Ltd., Saral Sky Suites, Nigam Nagar, Chandkheda, Dist. Ahmedabad, Gujarat - 382424.	West	AnG India Ltd
HDFC phase 4	3582	#N/A	SANATHAL	Gujarat	Ahmedabad	Hdfc Bank Ltd.Gokuldham Arcade,Sanand-Sanathal Highway, Sanathal, Ahmedabad	West	AnG India Ltd
HDFC phase 4	8086	#N/A	PANCHSHIL PEARL, NARANPURA	Gujarat	Ahmedabad	Hdfc Bank Ltd Panchshil Pearl, Naranpura Railway Crossing Road,Panchshil Society, Shanti Nagar,Ahmedabad, Gujarat – 380013	West	AnG India Ltd
HDFC phase 4	958	#N/A	NARODA, AHMEDABAD	Gujarat	Ahmedabad	Hdfc Bank Ltd.Galaxy Arcade, Nr Galaxy Avenue, Opp Galaxy Cinema,Naroda, Ahmedabad-382330	West	AnG India Ltd
HDFC phase 4	4579	#N/A	BILLIONAIRE STREET, AMBLI ROAD, AHMEDABAD	Gujarat	Ahmedabad	Hdfc Bank Ltd. Shaligram Corporate , Nr Dishman House , Off Bopal Ambli Road ,Bodakdev , Ahmedabad	West	AnG India Ltd
HDFC phase 4	5018	#N/A	SHEETAL WESTPARK IMPERIA, AHMEDABAD	Gujarat	Ahmedabad	Hdfc Bank Ltd.West Park Imperia, Sheetal West Park Imperia, Nr Alpha One Mall, Vastrapur,Ahmedabad – 380054	West	AnG India Ltd
HDFC phase 4	3512	#N/A	BOL	Gujarat	Ahmedabad	B11 & B12 Shivdhara Complex, GIDC Sanand, Bol Village,Ahmedabad	West	AnG India Ltd
HDFC phase 4	7455	#N/A	SEC - 21, GANDHINAGAR	Gujarat	Gandhinagar	Hdfc Bank Ltd., Grd. Floor, A-2, District Shopping Centre, Sector - 21, Dist. Gandhinagar, Gujarat - 382021.	West	AnG India Ltd
HDFC phase 4	7656	#N/A	KUDASAN, GANDHINAGAR	Gujarat	Gandhinagar	Hdfc Bank Ltd, Grd.Floor, Shop No. B-6 , The Landmark, Landmark Cross Roads, Opp. Kansar Restaurant , Kudasan, Gandhinagar Gujarat -382421	West	AnG India Ltd
HDFC phase 4	8168	#N/A	CHHATRAL- II	Gujarat	Gandhinagar	Hdfc Bank Ltd., Grd. Floor, Shop No. 26, 27, 28, 38, 39 & 40, D. K. Complex, Main Highway Chhatral, Dist. Gandhinagar, Gujarat - 382729	West	AnG India Ltd
HDFC phase 4	2497	#N/A	INFO CITY, GANDHINAGAR	Gujarat	Gandhinagar	Gf-2, Ground Floor, Super Mall-Ii, Infocity Complex, Near Indroda Circls, Gandhinagar, Gujarat	West	AnG India Ltd
HDFC phase 4	7978	#N/A	SHANTIGRAM	Gujarat	Gandhinagar	Hdfc Bank Ltd., Crown 1, Inspire Business Park, S.G. Highway, Shantigram, Dist. Gandhinagar, Gujarat - 382421	West	AnG India Ltd
HDFC phase 4	3626	#N/A	AJOL	Gujarat	Gandhinagar	Hdfc Bank Ltd.Shree Ajol Dudh Utpadak Sm Ltd ,Delwada Road ,Ajol Ta Mansa District Gandhinagar	West	AnG India Ltd
HDFC phase 4	8131	#N/A	GANDHINAGAR, GIDC	Gujarat	Gandhinagar	Hdfc Bank Ltd., Ground Floor, B23/2/1 & 2, Gezia, Electronics Estate, Sector 25, Gidc, Gandhinagar.	West	AnG India Ltd
HDFC phase 4	8066	#N/A	GIFT CITY, GANDHINAGAR	Gujarat	Gandhinagar	Hdfc Bank Ltd. Tower D, World Tarde Centre, Gift City -Gandhinagar	West	AnG India Ltd
HDFC phase 4	4624	#N/A	ZUNDAL CIRCLE, GANDHI NAGAR	Gujarat	Gandhinagar	Hdfc Bank Ltd., Savya Skyz, Opposite Shantavan Party Plot, Zundal, Dist. Gandhinagar, Gujarat - 382421.	West	AnG India Ltd
HDFC phase 4	5032	#N/A	RAKSHA SHAKTI CIRCLE, GANDHINAGAR	Gujarat	Gandhinagar	HDFC Bank Ltd.,Radhe Infinity, Raksha Shakti Circle,Randesan,Dist. Gandhinagar, Gujarat - 382421.	West	AnG India Ltd
EOT;

$lines = explode("\n", trim($data));

foreach ($lines as $line) {
    $cols = explode("\t", $line);
    if (count($cols) >= 7) {
        $name = trim($cols[0]);
        $code = trim($cols[1]);
        $state = trim($cols[4]);
        $city = trim($cols[5]);
        $address = trim($cols[6]);

        // Attempt geocoding
        $lat = null;
        $lng = null;
        $url = "https://nominatim.openstreetmap.org/search?format=json&q=" . urlencode($address);
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'HarshitInvoiceSite/1.0 (harshit@example.com)');
        $response = curl_exec($ch);
        curl_close($ch);
        
        if ($response) {
            $json = json_decode($response, true);
            if ($json && count($json) > 0) {
                $lat = $json[0]['lat'];
                $lng = $json[0]['lon'];
            }
        }
        
        $stmt = $pdo->prepare("INSERT INTO sites (name, code, city, address, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $code, $city, $address, $lat, $lng]);
        
        echo "Inserted $code - $name (Lat: $lat, Lng: $lng)\n";
        sleep(1); // rate limit for nominatim
    }
}
echo "Done importing sites!\n";
