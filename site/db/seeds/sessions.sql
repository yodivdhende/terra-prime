INSERT INTO `Sessions` (`Token`, `UserId`, `Description`, `Start`, `End`) VALUES
('7114b7ae-bec8-4af9-aefe-e44585709041', 1, 'cmd yodi.vandenhende@gmail.com', '2025-06-16 16:50:59', NULL),
('b8152d21-1517-454b-998a-dc93b6e5553d', 1, 'api login yodi.vandenhende@gmail.com', '2025-06-16 16:50:06', '2025-06-17 16:50:06');

INSERT INTO `Session_Roles` (`Token`, `Role`) VALUES
('7114b7ae-bec8-4af9-aefe-e44585709041', 'player'),
('b8152d21-1517-454b-998a-dc93b6e5553d', 'admin'),
('b8152d21-1517-454b-998a-dc93b6e5553d', 'user');
