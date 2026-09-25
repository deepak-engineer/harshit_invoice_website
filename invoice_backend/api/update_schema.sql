-- Update sites
ALTER TABLE sites 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS geofence_radius INT DEFAULT 100,
ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS dsc_panel_info TEXT DEFAULT NULL;

-- Update employees
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS role ENUM('ADMIN', 'SUPERVISOR', 'TECHNICIAN') DEFAULT 'TECHNICIAN',
ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT NULL;

-- Site Assignments
CREATE TABLE IF NOT EXISTS site_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_id INT NOT NULL,
  team_id INT NOT NULL,
  technician_id INT DEFAULT NULL,
  assigned_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- Update attendance
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS check_in_distance DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS check_out_distance DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS geofence_radius INT DEFAULT NULL;

-- Checklist Templates
CREATE TABLE IF NOT EXISTS checklist_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  FOREIGN KEY (template_id) REFERENCES checklist_templates(id) ON DELETE CASCADE
);

-- Work Orders
CREATE TABLE IF NOT EXISTS work_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attendance_id INT NOT NULL,
  site_id INT NOT NULL,
  technician_id INT NOT NULL,
  status ENUM('NOT_STARTED', 'WORKING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'COMPLETED') DEFAULT 'NOT_STARTED',
  start_time DATETIME DEFAULT NULL,
  end_time DATETIME DEFAULT NULL,
  supervisor_id INT DEFAULT NULL,
  supervisor_remarks TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE CASCADE,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Work Order Checklist
CREATE TABLE IF NOT EXISTS work_order_checklist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  work_order_id INT NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  status ENUM('PENDING', 'PASSED', 'FAILED', 'NOT_APPLICABLE') DEFAULT 'PENDING',
  remarks TEXT DEFAULT NULL,
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
);

-- Work Photos
CREATE TABLE IF NOT EXISTS work_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  work_order_id INT NOT NULL,
  checklist_item_id INT DEFAULT NULL,
  photo_type VARCHAR(50) DEFAULT 'GENERAL',
  photo_url LONGTEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
);

INSERT INTO checklist_templates (name, is_active) 
SELECT 'DSC Panel Standard', 1
WHERE NOT EXISTS (SELECT 1 FROM checklist_templates WHERE name = 'DSC Panel Standard');

INSERT INTO checklist_items (template_id, item_name)
SELECT id, 'DSC Panel Power' FROM checklist_templates WHERE name = 'DSC Panel Standard'
AND NOT EXISTS (SELECT 1 FROM checklist_items WHERE template_id = checklist_templates.id AND item_name = 'DSC Panel Power');

INSERT INTO checklist_items (template_id, item_name)
SELECT id, 'PIR Sensor' FROM checklist_templates WHERE name = 'DSC Panel Standard'
AND NOT EXISTS (SELECT 1 FROM checklist_items WHERE template_id = checklist_templates.id AND item_name = 'PIR Sensor');

INSERT INTO checklist_items (template_id, item_name)
SELECT id, 'Magnetic Contact / MC' FROM checklist_templates WHERE name = 'DSC Panel Standard'
AND NOT EXISTS (SELECT 1 FROM checklist_items WHERE template_id = checklist_templates.id AND item_name = 'Magnetic Contact / MC');

INSERT INTO checklist_items (template_id, item_name)
SELECT id, 'Glass Break Detector / GBD' FROM checklist_templates WHERE name = 'DSC Panel Standard'
AND NOT EXISTS (SELECT 1 FROM checklist_items WHERE template_id = checklist_templates.id AND item_name = 'Glass Break Detector / GBD');

INSERT INTO checklist_items (template_id, item_name)
SELECT id, 'Seismic Sensor' FROM checklist_templates WHERE name = 'DSC Panel Standard'
AND NOT EXISTS (SELECT 1 FROM checklist_items WHERE template_id = checklist_templates.id AND item_name = 'Seismic Sensor');

INSERT INTO checklist_items (template_id, item_name)
SELECT id, 'Shutter Sensor' FROM checklist_templates WHERE name = 'DSC Panel Standard'
AND NOT EXISTS (SELECT 1 FROM checklist_items WHERE template_id = checklist_templates.id AND item_name = 'Shutter Sensor');

INSERT INTO checklist_items (template_id, item_name)
SELECT id, 'Communication' FROM checklist_templates WHERE name = 'DSC Panel Standard'
AND NOT EXISTS (SELECT 1 FROM checklist_items WHERE template_id = checklist_templates.id AND item_name = 'Communication');

INSERT INTO checklist_items (template_id, item_name)
SELECT id, 'Alarm Test' FROM checklist_templates WHERE name = 'DSC Panel Standard'
AND NOT EXISTS (SELECT 1 FROM checklist_items WHERE template_id = checklist_templates.id AND item_name = 'Alarm Test');

INSERT INTO checklist_items (template_id, item_name)
SELECT id, 'Final Panel Test' FROM checklist_templates WHERE name = 'DSC Panel Standard'
AND NOT EXISTS (SELECT 1 FROM checklist_items WHERE template_id = checklist_templates.id AND item_name = 'Final Panel Test');
ALTER TABLE attendance ADD COLUMN attendance_photo VARCHAR(255) NULL AFTER status;
