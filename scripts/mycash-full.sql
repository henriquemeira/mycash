PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE d1_migrations(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(1,'0000_odd_network.sql','2026-06-08 01:56:02');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(2,'0001_overrated_tempest.sql','2026-06-08 01:56:03');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(3,'0002_steep_microchip.sql','2026-06-08 01:56:03');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(4,'0003_clever_miracleman.sql','2026-06-08 01:56:03');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(5,'0004_acoustic_beast.sql','2026-06-08 01:56:04');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(6,'0005_great_maelstrom.sql','2026-06-08 01:56:04');
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'checking' NOT NULL,
	`color` text DEFAULT '#3b82f6' NOT NULL,
	`initial_balance` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'BRL' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO "accounts" ("id","user_id","name","type","color","initial_balance","currency","created_at","updated_at","deleted_at") VALUES('322197710616793089','322197710616793088','Geral','cash','#3b82f6',0,'BRL',1780885120,1780952827,NULL);
INSERT INTO "accounts" ("id","user_id","name","type","color","initial_balance","currency","created_at","updated_at","deleted_at") VALUES('322449421382062081','322449421382062080','CAIXA','cash','#3b82f6',0,'BRL',1780945132,1780945132,NULL);
INSERT INTO "accounts" ("id","user_id","name","type","color","initial_balance","currency","created_at","updated_at","deleted_at") VALUES('322481625998954496','322197710616793088','Itau','checking','#ef4444',0,'BRL',1780952811,1780952811,NULL);
INSERT INTO "accounts" ("id","user_id","name","type","color","initial_balance","currency","created_at","updated_at","deleted_at") VALUES('322481740662837248','322197710616793088','Inter/Bru','checking','#ec4899',0,'BRL',1780952838,1780952838,NULL);
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`color` text DEFAULT '#6b7280' NOT NULL,
	`icon` text DEFAULT 'tag' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO "categories" ("id","user_id","name","type","color","icon","created_at","updated_at","deleted_at") VALUES('322197710616793090','322197710616793088','Receitas','income','#22c55e','trending-up',1780885120,1780952710,NULL);
INSERT INTO "categories" ("id","user_id","name","type","color","icon","created_at","updated_at","deleted_at") VALUES('322197710616793091','322197710616793088','Despesas','expense','#ef4444','trending-down',1780885120,1780952672,NULL);
INSERT INTO "categories" ("id","user_id","name","type","color","icon","created_at","updated_at","deleted_at") VALUES('322449421382062082','322449421382062080','RECEITAS','income','#22c55e','trending-up',1780945132,1780945132,NULL);
INSERT INTO "categories" ("id","user_id","name","type","color","icon","created_at","updated_at","deleted_at") VALUES('322449421382062083','322449421382062080','DESPESAS','expense','#ef4444','trending-down',1780945132,1780945132,NULL);
INSERT INTO "categories" ("id","user_id","name","type","color","icon","created_at","updated_at","deleted_at") VALUES('322481071088340992','322197710616793088','Lar','expense','#f43f5e','home',1780952678,1780960383,NULL);
INSERT INTO "categories" ("id","user_id","name","type","color","icon","created_at","updated_at","deleted_at") VALUES('322481123450032128','322197710616793088','Cartão de Crédito','expense','#0ea5e9','wallet',1780952691,1780960361,NULL);
INSERT INTO "categories" ("id","user_id","name","type","color","icon","created_at","updated_at","deleted_at") VALUES('322481145365270528','322197710616793088','Energia','expense','#78716c','dumbbell',1780952696,1780960344,NULL);
INSERT INTO "categories" ("id","user_id","name","type","color","icon","created_at","updated_at","deleted_at") VALUES('322481173718765568','322197710616793088','Consórcio','expense','#14b8a6','tag',1780952703,1780952703,NULL);
INSERT INTO "categories" ("id","user_id","name","type","color","icon","created_at","updated_at","deleted_at") VALUES('322481242023006208','322197710616793088','Repasse','income','#a855f7','tag',1780952719,1780952719,NULL);
INSERT INTO "categories" ("id","user_id","name","type","color","icon","created_at","updated_at","deleted_at") VALUES('322481322209710080','322197710616793088','Aluguel','expense','#10b981','home',1780952738,1780960373,NULL);
INSERT INTO "categories" ("id","user_id","name","type","color","icon","created_at","updated_at","deleted_at") VALUES('322481351540477952','322197710616793088','Manutenção','expense','#0ea5e9','beer',1780952745,1780960415,NULL);
INSERT INTO "categories" ("id","user_id","name","type","color","icon","created_at","updated_at","deleted_at") VALUES('322481370788139008','322197710616793088','Internet','expense','#eab308','laptop',1780952750,1780960422,NULL);
INSERT INTO "categories" ("id","user_id","name","type","color","icon","created_at","updated_at","deleted_at") VALUES('322481395354177536','322197710616793088','Impostos','expense','#ec4899','dollar-sign',1780952756,1780960432,NULL);
INSERT INTO "categories" ("id","user_id","name","type","color","icon","created_at","updated_at","deleted_at") VALUES('322491244670488576','322197710616793088','Complemento','income','#eab308','tag',1780955104,1780955104,NULL);
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`last_login_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
INSERT INTO "users" ("id","email","password_hash","status","last_login_at","created_at","updated_at","deleted_at") VALUES('322197710616793088','henrique@meira.net','facf3a59fc46270856fe050e8782fd00:e764cd176a03fba266aa716f4acb14cdf27fac85694f68f4ae4a917a24403101','active',1780965900,1780885120,1780965900,NULL);
INSERT INTO "users" ("id","email","password_hash","status","last_login_at","created_at","updated_at","deleted_at") VALUES('322449421382062080','filipe@meira.net','6f206ecb2993f68ab9762c85c94e22ea:1c894d58fc7c481dbe3ffe9dff9c2633db82078f2b2b7b65356046edad2d9002','active',NULL,1780945132,1780945132,NULL);
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`category_id` text NOT NULL,
	`description` text NOT NULL,
	`amount` integer NOT NULL,
	`date` text NOT NULL,
	`type` text NOT NULL,
	`is_paid` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer, `due_date` text, `recurrence_id` text, `installment_number` integer, `total_installments` integer, `notes` text, `reminder_date` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322210770697981952','322197710616793088','322197710616793089','322197710616793090','Lançamento de saldo inicial',10000,'2026-06-08','income',1,1780888234,1780888282,NULL,'2026-01-01',NULL,NULL,NULL,'Uma nota de saldo inicial','2026-06-09');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322211312870494208','322197710616793088','322197710616793089','322481071088340992','Aluguel San Carlo',-350000,'2026-06-08','expense',0,1780888363,1780953256,1780954537,'2026-06-08',NULL,NULL,NULL,NULL,'2026-06-08');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322482068133122049','322197710616793088','322481740662837248','322481071088340992','Condomínio San Carlo',-182538,'2026-06-08','expense',1,1780952916,1780952935,NULL,'2026-01-05','322482068133122048',1,12,NULL,'2026-01-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322482068728713216','322197710616793088','322481740662837248','322481071088340992','Condomínio San Carlo',-182538,'2026-07-08','expense',1,1780952916,1780952940,NULL,'2026-02-05','322482068133122048',2,12,NULL,'2026-02-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322482069265584128','322197710616793088','322481740662837248','322481071088340992','Condomínio San Carlo',-182538,'2026-08-08','expense',1,1780952916,1780952943,NULL,'2026-03-05','322482068133122048',3,12,NULL,'2026-03-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322482069794066432','322197710616793088','322481740662837248','322481071088340992','Condomínio San Carlo',-182538,'2026-09-08','expense',1,1780952916,1780952948,NULL,'2026-04-05','322482068133122048',4,12,NULL,'2026-04-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322482070368686080','322197710616793088','322481740662837248','322481071088340992','Condomínio San Carlo',-182538,'2026-10-08','expense',1,1780952916,1780952951,NULL,'2026-05-05','322482068133122048',5,12,NULL,'2026-05-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322482070901362688','322197710616793088','322481740662837248','322481071088340992','Condomínio San Carlo',-182538,'2026-11-08','expense',1,1780952916,1780952974,NULL,'2026-06-05','322482068133122048',6,12,NULL,'2026-06-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322482071438233600','322197710616793088','322481740662837248','322481071088340992','Condomínio San Carlo',-182538,'2026-12-08','expense',0,1780952916,1780952916,NULL,'2026-07-05','322482068133122048',7,12,NULL,'2026-07-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322482072017047552','322197710616793088','322481740662837248','322481071088340992','Condomínio San Carlo',-182538,'2027-01-08','expense',0,1780952916,1780952916,NULL,'2026-08-05','322482068133122048',8,12,NULL,'2026-08-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322482072595861504','322197710616793088','322481740662837248','322481071088340992','Condomínio San Carlo',-182538,'2027-02-08','expense',0,1780952916,1780952916,NULL,'2026-09-05','322482068133122048',9,12,NULL,'2026-09-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322482073132732416','322197710616793088','322481740662837248','322481071088340992','Condomínio San Carlo',-182538,'2027-03-08','expense',0,1780952916,1780952916,NULL,'2026-10-05','322482068133122048',10,12,NULL,'2026-10-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322482073673797632','322197710616793088','322481740662837248','322481071088340992','Condomínio San Carlo',-182538,'2027-04-08','expense',0,1780952916,1780952916,NULL,'2026-11-05','322482068133122048',11,12,NULL,'2026-11-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322482074214862848','322197710616793088','322481740662837248','322481071088340992','Condomínio San Carlo',-182538,'2027-05-08','expense',0,1780952916,1780952916,NULL,'2026-12-05','322482068133122048',12,12,NULL,'2026-12-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322483692826136576','322197710616793088','322197710616793089','322481123450032128','Cartão Inter/Bru',-7800,'2026-01-04','expense',1,1780953303,1780953311,NULL,'2026-01-04',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322483965359427584','322197710616793088','322197710616793089','322481071088340992','Enel San Carlo',-18954,'2026-01-06','expense',1,1780953368,1780953370,NULL,'2026-01-06',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322484222403153921','322197710616793088','322481740662837248','322481173718765568','Consórcio Moto',-67037,'2026-06-08','expense',1,1780953430,1780953438,NULL,'2026-01-07','322484222403153920',1,12,NULL,'2026-06-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322484222960996352','322197710616793088','322481740662837248','322481173718765568','Consórcio Moto',-67037,'2026-07-08','expense',1,1780953430,1780953442,NULL,'2026-02-07','322484222403153920',2,12,NULL,'2026-07-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322484223523033088','322197710616793088','322481740662837248','322481173718765568','Consórcio Moto',-67037,'2026-08-08','expense',1,1780953430,1780953445,NULL,'2026-03-07','322484222403153920',3,12,NULL,'2026-08-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322484224064098304','322197710616793088','322481740662837248','322481173718765568','Consórcio Moto',-67037,'2026-09-08','expense',1,1780953430,1780953448,NULL,'2026-04-07','322484222403153920',4,12,NULL,'2026-09-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322484224605163520','322197710616793088','322481740662837248','322481173718765568','Consórcio Moto',-67037,'2026-10-08','expense',1,1780953430,1780953452,NULL,'2026-05-07','322484222403153920',5,12,NULL,'2026-10-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322484225154617344','322197710616793088','322481740662837248','322481173718765568','Consórcio Moto',-67037,'2026-11-08','expense',1,1780953430,1780955255,NULL,'2026-06-08',NULL,NULL,NULL,NULL,'2026-11-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322484225695682560','322197710616793088','322481740662837248','322481173718765568','Consórcio Moto',-67037,'2026-12-08','expense',0,1780953430,1780953430,NULL,'2026-07-07','322484222403153920',7,12,NULL,'2026-12-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322484226240942080','322197710616793088','322481740662837248','322481173718765568','Consórcio Moto',-67037,'2027-01-08','expense',0,1780953430,1780953430,NULL,'2026-08-07','322484222403153920',8,12,NULL,'2027-01-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322484226786201600','322197710616793088','322481740662837248','322481173718765568','Consórcio Moto',-67037,'2027-02-08','expense',0,1780953430,1780953430,NULL,'2026-09-07','322484222403153920',9,12,NULL,'2027-02-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322484227335655424','322197710616793088','322481740662837248','322481173718765568','Consórcio Moto',-67037,'2027-03-08','expense',0,1780953430,1780953430,NULL,'2026-10-07','322484222403153920',10,12,NULL,'2027-03-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322484227922857984','322197710616793088','322481740662837248','322481173718765568','Consórcio Moto',-67037,'2027-04-08','expense',0,1780953430,1780953430,NULL,'2026-11-07','322484222403153920',11,12,NULL,'2027-04-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322484228476506112','322197710616793088','322481740662837248','322481173718765568','Consórcio Moto',-67037,'2027-05-08','expense',0,1780953430,1780953430,NULL,'2026-12-07','322484222403153920',12,12,NULL,'2027-05-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322489145895292929','322197710616793088','322481740662837248','322481071088340992','Aluguel',-344755,'2026-06-08','expense',1,1780954603,1780965712,NULL,'2026-01-07',NULL,NULL,NULL,NULL,'2026-06-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322489146461523968','322197710616793088','322481740662837248','322481071088340992','Aluguel',-355626,'2026-07-08','expense',0,1780954603,1780954603,NULL,'2026-02-07','322489145895292928',2,12,NULL,'2026-07-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322489147010977792','322197710616793088','322481740662837248','322481071088340992','Aluguel',-355626,'2026-08-08','expense',0,1780954603,1780954603,NULL,'2026-03-07','322489145895292928',3,12,NULL,'2026-08-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322489147552043008','322197710616793088','322481740662837248','322481071088340992','Aluguel',-355626,'2026-09-08','expense',0,1780954603,1780954603,NULL,'2026-04-07','322489145895292928',4,12,NULL,'2026-09-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322489148088913920','322197710616793088','322481740662837248','322481071088340992','Aluguel',-355626,'2026-10-08','expense',1,1780954603,1780960490,NULL,'2026-05-07','322489145895292928',5,12,NULL,'2026-10-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322489148613201920','322197710616793088','322481740662837248','322481071088340992','Aluguel',-355626,'2026-11-08','expense',1,1780954603,1780955213,NULL,'2026-06-08',NULL,NULL,NULL,NULL,'2026-11-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322489149175238656','322197710616793088','322481740662837248','322481071088340992','Aluguel',-355626,'2026-12-08','expense',0,1780954603,1780954603,NULL,'2026-07-07','322489145895292928',7,12,NULL,'2026-12-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322489149741469696','322197710616793088','322481740662837248','322481071088340992','Aluguel',-355626,'2027-01-08','expense',0,1780954603,1780954603,NULL,'2026-08-07','322489145895292928',8,12,NULL,'2027-01-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322489150282534912','322197710616793088','322481740662837248','322481071088340992','Aluguel',-355626,'2027-02-08','expense',0,1780954603,1780954603,NULL,'2026-09-07','322489145895292928',9,12,NULL,'2027-02-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322489150852960256','322197710616793088','322481740662837248','322481071088340992','Aluguel',-355626,'2027-03-08','expense',0,1780954603,1780954603,NULL,'2026-10-07','322489145895292928',10,12,NULL,'2027-03-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322489151410802688','322197710616793088','322481740662837248','322481071088340992','Aluguel',-355626,'2027-04-08','expense',0,1780954603,1780954603,NULL,'2026-11-07','322489145895292928',11,12,NULL,'2027-04-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322489151947673600','322197710616793088','322481740662837248','322481071088340992','Aluguel',-355626,'2027-05-08','expense',0,1780954603,1780954603,NULL,'2026-12-07','322489145895292928',12,12,NULL,'2027-05-04');
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322491563123019776','322197710616793088','322197710616793089','322491244670488576','Auxilio pgto aluguel (Bruna)',292700,'2026-06-08','income',0,1780955180,1780955327,1780955330,'2026-06-08',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "transactions" ("id","user_id","account_id","category_id","description","amount","date","type","is_paid","created_at","updated_at","deleted_at","due_date","recurrence_id","installment_number","total_installments","notes","reminder_date") VALUES('322492163617329152','322197710616793088','322481740662837248','322491244670488576','Auxilio pgto aluguel (Bruna)',292700,'2026-06-08','income',1,1780955323,1780960672,NULL,'2026-06-08',NULL,NULL,NULL,NULL,NULL);
CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`user_id` text NOT NULL,
	`file_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`file_key` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO "attachments" ("id","transaction_id","user_id","file_name","content_type","size","file_key","status","created_at","deleted_at") VALUES('322210894698385408','322210770697981952','322197710616793088','mycash-2026-06.csv','text/csv',1058,'322197710616793088/attachments/2026/06/08/daee401e-e632-43ab-a6ef-ef94827e957e.csv','confirmed',1780888263,NULL);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('d1_migrations',6);
CREATE INDEX `accounts_user_idx` ON `accounts` (`user_id`,`deleted_at`);
CREATE INDEX `categories_user_idx` ON `categories` (`user_id`,`type`);
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
CREATE INDEX `users_email_idx` ON `users` (`email`);
CREATE INDEX `transactions_user_date_idx` ON `transactions` (`user_id`,`date`,`deleted_at`);
CREATE INDEX `transactions_recurrence_idx` ON `transactions` (`recurrence_id`);
CREATE INDEX `attachments_transaction_idx` ON `attachments` (`transaction_id`,`deleted_at`);
CREATE INDEX `attachments_user_idx` ON `attachments` (`user_id`);
