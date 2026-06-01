-- ============================================================
-- IMPORTAÇÃO DO INVENTARIO
-- Cole no SQL Editor do Supabase e clique em Run
-- ============================================================

-- Limpar dados existentes
DELETE FROM purchase_lines;
DELETE FROM purchases;
DELETE FROM outing_pending_resolved;
DELETE FROM outing_pending_items;
DELETE FROM outing_items;
DELETE FROM outings;
DELETE FROM equipment;
DELETE FROM groups;

-- GRUPOS
INSERT INTO groups (id, name) VALUES ('verizon-gps', 'Verizon GPS');
INSERT INTO groups (id, name) VALUES ('materiais', 'Materiais');
INSERT INTO groups (id, name) VALUES ('campo', 'Campo');
INSERT INTO groups (id, name) VALUES ('mecanica', 'Mecânica');
INSERT INTO groups (id, name) VALUES ('elier', 'Elier');
INSERT INTO groups (id, name) VALUES ('diesel-laptop', 'Diesel Laptop');

-- ESTOQUE
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00001','Verizon GPS','Rastreamento','verizon-gps',17,0,'returnable',0,'SN 2300399028 - Novo | SN 2300377517 - Novo | SN 2300380829 - Novo | SN 2300380371 - Novo | SN 2300326083 - Precisa trocar (+12 mais)');
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00002','Y cable','Rastreamento','verizon-gps',3,0,'returnable',0,'Chegaram 3 cabos Y no total');
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00003','iPads','Materiais','materiais',6,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00004','Samsung GPS','Materiais','materiais',7,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00005','Bounce GPS','Materiais','materiais',4,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00006','Manual press','Materiais','materiais',7,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00007','OBD adapter','Materiais','materiais',13,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00008','Safety vests','Materiais','materiais',420,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00009','Hitch','Materiais','materiais',2,0,'returnable',0,'2 pares / 2 pairs');
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00010','Y cable','Materiais','materiais',2,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00011','Drilling bit','Materiais','materiais',3,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00012','Manual with tool','Materiais','materiais',2,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00013','Utility locators','Materiais','materiais',4,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00014','GPR','Materiais','materiais',2,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00015','Traffic cones','Campo','campo',88,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00016','Drill/driver','Campo','campo',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00017','Wide shovel','Campo','campo',2,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00018','Narrow shovel','Campo','campo',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00019','Curved trenching shovel','Campo','campo',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00020','Rake','Campo','campo',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00021','Leaf rake','Campo','campo',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00022','Pickaxe','Campo','campo',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00023','Tool kit/case','Campo','campo',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00024','Small compressor','Campo','campo',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00025','Soil tamper','Campo','campo',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00026','1005 gallon free-standing horizontal leg tank','Campo','campo',4,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00027','Gasoline injector tester','Mecânica','mecanica',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00028','Diesel injector tester','Mecânica','mecanica',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00029','Jumper cables','Mecânica','mecanica',3,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00030','Electric sander','Mecânica','mecanica',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00031','Electric orbital sander','Mecânica','mecanica',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00032','A/C vacuum pump','Mecânica','mecanica',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00033','Ryobi electric saw','Mecânica','mecanica',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00034','Milwaukee jigsaw','Mecânica','mecanica',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00035','Electric grease gun','Mecânica','mecanica',2,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00036','Welding mask','Mecânica','mecanica',2,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00037','Transmission jack','Mecânica','mecanica',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00038','Hydraulic tool kit','Mecânica','mecanica',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00039','Hercules electric saw','Mecânica','mecanica',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00040','Corded drill','Mecânica','mecanica',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00041','Electric drill','Mecânica','mecanica',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00042','Electric heat gun','Mecânica','mecanica',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00043','Electric screwdriver','Mecânica','mecanica',3,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00044','Small electric impact wrench','Mecânica','mecanica',2,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00045','Large electric impact wrench','Mecânica','mecanica',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00046','Hyper Tough electric saw','Mecânica','mecanica',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00047','Milwaukee chargers','Mecânica','mecanica',4,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00048','Ryobi chargers','Mecânica','mecanica',2,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00049','Bauer chargers','Mecânica','mecanica',2,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00050','Kobalt chargers','Mecânica','mecanica',2,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00051','Milwaukee batteries','Mecânica','mecanica',4,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00052','Angle grinder','Mecânica','mecanica',2,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00053','45-degree cutter','Mecânica','mecanica',2,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00054','Bench grinder','Mecânica','mecanica',2,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00055','Generator','Mecânica','mecanica',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00056','Air compressor','Mecânica','mecanica',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00057','Engine hoist','Mecânica','mecanica',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00058','Welder','Mecânica','mecanica',2,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00059','Plasma cutter','Mecânica','mecanica',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00060','Jack','Mecânica','mecanica',3,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00061','Blower','Mecânica','mecanica',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00062','MIG welder','Mecânica','elier',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00063','Hercules long-reach ratchet','Mecânica','elier',4,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00064','Hercules compact saw','Mecânica','elier',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00065','Hercules oscillating multi-tool','Mecânica','elier',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00066','Hercules drill','Mecânica','elier',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00067','Hercules batteries','Mecânica','elier',7,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00068','Computer','Eletrônicos','diesel-laptop',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00069','Charger','Eletrônicos','diesel-laptop',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00070','Power bank','Eletrônicos','diesel-laptop',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00071','Communicator','Eletrônicos','diesel-laptop',1,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00072','Adapters','Eletrônicos','diesel-laptop',7,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00073','Car charger','Eletrônicos','diesel-laptop',2,0,'returnable',0,NULL);
INSERT INTO equipment (id,name,category,group_id,quantity,in_use,type,last_unit_price,notes) VALUES ('id00074','USB cable','Eletrônicos','diesel-laptop',1,0,'returnable',0,NULL);

-- COMPRAS
INSERT INTO purchases (id,date,location,notes,outing_id,grand_total) VALUES ('id00075',NULL,'Tires & Wheels Shop','Invoice 14857',NULL,380.00);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00076','id00075',NULL,'New tires (235/85R16 Nebula 16 ply)',2,190.00);
INSERT INTO purchases (id,date,location,notes,outing_id,grand_total) VALUES ('id00077',NULL,'Tires & Wheels Shop','Invoice 14930',NULL,1810.00);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00078','id00077',NULL,'New tires (235/80R16, 16 ply)',6,190.00);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00079','id00077',NULL,'New tires (235/80R16, 16)',1,190.00);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00080','id00077',NULL,'New rims (16 inch, 8 lugs)',4,110.00);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00081','id00077',NULL,'Patch (Patch)',1,40.00);
INSERT INTO purchases (id,date,location,notes,outing_id,grand_total) VALUES ('id00082',NULL,'Tires & Wheels Shop','Invoice 15243',NULL,990.00);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00083','id00082',NULL,'New rims (17.5)',1,250.00);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00084','id00082',NULL,'New tires (275/60R20 Lanvigator RAM 1500)',4,185.00);
INSERT INTO purchases (id,date,location,notes,outing_id,grand_total) VALUES ('id00085',NULL,'Tires & Wheels Shop','Invoice 15260',NULL,1575.00);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00086','id00085',NULL,'New tires (235/75R17.5 Ironman)',2,250.00);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00087','id00085',NULL,'Labor (Mount)',5,35.00);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00088','id00085',NULL,'New tires (215/75R17.5 Cosmo)',2,220.00);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00089','id00085',NULL,'New tires (235/80R16 ST, 16 ply)',2,190.00);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00090','id00085',NULL,'Patch (Patch)',2,40.00);
INSERT INTO purchases (id,date,location,notes,outing_id,grand_total) VALUES ('id00091','2026-05-26','Walker Customer','Walker Customer — Trailer Parts',NULL,869.00);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00092','id00091',NULL,'12K Electric Brakes LH',2,125.00);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00093','id00091',NULL,'12K Electric Brakes RH',2,125.00);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00094','id00091',NULL,'10K Electric Brakes LH',1,95.00);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00095','id00091',NULL,'10K Brake Drum w hub',1,200.00);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00096','id00091',NULL,'Bearing 387A',1,8.00);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00097','id00091',NULL,'Bearing 25580',1,6.00);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00098','id00091',NULL,'10K Oil Seal',1,12.00);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00099','id00091',NULL,'10K Oil Caps (New Style)',1,20.00);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00100','id00091',NULL,'Bolt for 10K brakes',7,4.00);
INSERT INTO purchases (id,date,location,notes,outing_id,grand_total) VALUES ('id00101','2026-06-01','TRK-016','AutoZone Invoice 03666652168',NULL,115.68);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00102','id00101',NULL,'Fuel filter — Duralast Fuel Filter - SKU 001146314',1,51.40);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00103','id00101',NULL,'Diesel fuel filter — Duralast Diesel Fuel Filter - SKU 000366502',1,57.22);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00104','id00101',NULL,'Tax',1,7.06);
INSERT INTO purchases (id,date,location,notes,outing_id,grand_total) VALUES ('id00105','2026-06-01','office','Home Depot receipt 8926 62 33613',NULL,39.98);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00106','id00105',NULL,'25 ft. Deluxe HDMI cable — 25 ft. Deluxe HDMI cable - Black',1,39.98);
INSERT INTO purchases (id,date,location,notes,outing_id,grand_total) VALUES ('id00107','2026-06-01','TRK-016','O''Reilly Invoice 4397-402692',NULL,178.58);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00108','id00107',NULL,'Fuel filter — Item 68436631AA - Fuel Filter',1,75.99);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00109','id00107',NULL,'Fuel filter — Item M0291 - Fuel Filter',1,102.59);
INSERT INTO purchases (id,date,location,notes,outing_id,grand_total) VALUES ('id00110','2026-05-29','TRK-021','O''Reilly Invoice 4397-402240 + Tax $2.60',NULL,163.08);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00111','id00110',NULL,'Valve cover gasket — Item 263-201 - VLV CVR GSKT',1,23.24);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00112','id00110',NULL,'Fuel injection pump gasket — Item GS33697 - F/INJ PMP GK',1,97.28);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00113','id00110',NULL,'Engine cleaner — Item EB1 - 15OZENGINCLN',1,6.49);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00114','id00110',NULL,'Electrical cleaner — Item 2206C - ELECTR CLNR',1,14.99);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00115','id00110',NULL,'Electrical cleaner — Item 2206C - ELECTR CLNR',1,14.99);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00116','id00110',NULL,'Degreaser — Item 46584 - 15OZDEGREASR',1,3.49);
INSERT INTO purchase_lines (id,purchase_id,equipment_id,name,qty,unit_price) VALUES ('id00117','id00110',NULL,'Tax',1,2.60);

-- FIM
-- Resultado: 74 itens estoque, 9 compras, 34 linhas
