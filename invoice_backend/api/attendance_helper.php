<?php

function haversineGreatCircleDistance($latitudeFrom, $longitudeFrom, $latitudeTo, $longitudeTo, $earthRadius = 6371000) {
  // convert from degrees to radians
  $latFrom = deg2rad($latitudeFrom);
  $lonFrom = deg2rad($longitudeFrom);
  $latTo = deg2rad($latitudeTo);
  $lonTo = deg2rad($longitudeTo);

  $latDelta = $latTo - $latFrom;
  $lonDelta = $lonTo - $lonFrom;

  $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
    cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
  return $angle * $earthRadius;
}

function processBase64Image($base64Data, $path_prefix = '../uploads/attendance/') {
    if (!$base64Data) return null;
    
    // Ensure directory exists
    if (!file_exists($path_prefix)) {
        mkdir($path_prefix, 0777, true);
    }
    
    if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
        $data = substr($base64Data, strpos($base64Data, ',') + 1);
        $type = strtolower($type[1]); // jpg, png, gif

        if (!in_array($type, ['jpg', 'jpeg', 'png'])) {
            throw new \Exception('invalid image type');
        }
        
        $data = base64_decode($data);
        if ($data === false) {
            throw new \Exception('base64_decode failed');
        }
    } else {
        throw new \Exception('did not match data URI with image data');
    }
    
    $filename = uniqid() . '.' . $type;
    file_put_contents($path_prefix . $filename, $data);
    
    return $filename;
}
?>
