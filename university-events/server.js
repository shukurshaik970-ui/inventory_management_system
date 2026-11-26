import express from 'express'
import session from 'express-session'
import helmet from 'helmet'
import bcrypt from 'bcryptjs'
import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const dbPath = process.env.DB_PATH || path.join(__dirname, 'inventory.db')
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('ADMIN','STAFF')), active INTEGER NOT NULL DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS suppliers (id INTEGER PRIMARY KEY AUTOINCREMENT, supplier_name TEXT NOT NULL, company_name TEXT, email TEXT, phone TEXT, address TEXT, contact_person TEXT, status TEXT NOT NULL DEFAULT 'ACTIVE', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS warehouses (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, location TEXT, address TEXT, manager_name TEXT, contact_number TEXT, status TEXT NOT NULL DEFAULT 'ACTIVE', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, sku TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT, category_id INTEGER, brand TEXT, unit TEXT NOT NULL DEFAULT 'pcs', purchase_price REAL NOT NULL DEFAULT 0, selling_price REAL NOT NULL DEFAULT 0, reorder_level INTEGER NOT NULL DEFAULT 0, barcode TEXT, status TEXT NOT NULL DEFAULT 'ACTIVE', supplier_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(category_id) REFERENCES categories(id), FOREIGN KEY(supplier_id) REFERENCES suppliers(id));
CREATE TABLE IF NOT EXISTS warehouse_stock (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, warehouse_id INTEGER NOT NULL, quantity INTEGER NOT NULL DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(product_id,warehouse_id), FOREIGN KEY(product_id) REFERENCES products(id), FOREIGN KEY(warehouse_id) REFERENCES warehouses(id));
CREATE TABLE IF NOT EXISTS stock_movements (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, warehouse_id INTEGER NOT NULL, movement_type TEXT NOT NULL CHECK(movement_type IN ('STOCK_IN','STOCK_OUT','STOCK_ADJUSTMENT')), quantity INTEGER NOT NULL, previous_stock INTEGER NOT NULL, new_stock INTEGER NOT NULL, reference_number TEXT, reason TEXT, notes TEXT, performed_by INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(product_id) REFERENCES products(id), FOREIGN KEY(warehouse_id) REFERENCES warehouses(id), FOREIGN KEY(performed_by) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS stock_transfers (id INTEGER PRIMARY KEY AUTOINCREMENT, source_warehouse_id INTEGER NOT NULL, destination_warehouse_id INTEGER NOT NULL, reference_number TEXT, notes TEXT, status TEXT NOT NULL DEFAULT 'COMPLETED', performed_by INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(source_warehouse_id) REFERENCES warehouses(id), FOREIGN KEY(destination_warehouse_id) REFERENCES warehouses(id), FOREIGN KEY(performed_by) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS stock_transfer_items (id INTEGER PRIMARY KEY AUTOINCREMENT, transfer_id INTEGER NOT NULL, product_id INTEGER NOT NULL, quantity INTEGER NOT NULL, FOREIGN KEY(transfer_id) REFERENCES stock_transfers(id), FOREIGN KEY(product_id) REFERENCES products(id));
CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, action TEXT NOT NULL, entity TEXT, entity_id INTEGER, details TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_stock_product ON warehouse_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_movement_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movement_date ON stock_movements(created_at);
`)

function seedDatabase() {
  const count = db.prepare('SELECT COUNT(*) c FROM users').get().c
  if (count === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin'
    const password = process.env.ADMIN_PASSWORD || 'Admin@123'
    const hash = bcrypt.hashSync(password, 10)
    db.prepare('INSERT INTO users(name,username,password_hash,role) VALUES(?,?,?,?)').run(process.env.ADMIN_NAME || 'System Administrator', username, hash, 'ADMIN')
  }
  if (db.prepare('SELECT COUNT(*) c FROM products').get().c === 0) {
    seedDemo()
  }
}

function seedDemo() {
  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories(name) VALUES (?)')
  ;['Electronics','Office','Furniture','Tools','Packaging'].forEach(name => insertCategory.run(name))
  const supplier = db.prepare('INSERT INTO suppliers(supplier_name,company_name,email,phone,address,contact_person,status) VALUES (?,?,?,?,?,?,?)')
  const suppliers = [['Arun Trading','Arun Trading Co','arun@example.com','9876543210','Mumbai','Arun','ACTIVE'],['Global Supplies','Global Supplies Pvt Ltd','sales@example.com','9876501234','Delhi','Meera','ACTIVE'],['Prime Tools','Prime Tools Ltd','orders@example.com','9123456780','Pune','Rahul','ACTIVE'],['Office Hub','Office Hub','contact@example.com','9988776655','Bengaluru','Sara','ACTIVE'],['PackRight','PackRight Industries','hello@example.com','9000012345','Chennai','Vikram','ACTIVE']]
  suppliers.forEach(s => supplier.run(...s))
  const warehouse = db.prepare('INSERT INTO warehouses(name,location,address,manager_name,contact_number,status) VALUES (?,?,?,?,?,?)')
  const warehouses = [['Central Warehouse','Mumbai','Andheri East','Rahul Verma','9871112222','ACTIVE'],['North Warehouse','Delhi','Dwarka','Priya Shah','9873334444','ACTIVE'],['South Warehouse','Bengaluru','Whitefield','Amit Kumar','9875556666','ACTIVE']]
  warehouses.forEach(w => warehouse.run(...w))
  const product = db.prepare('INSERT INTO products(sku,name,description,category_id,brand,unit,purchase_price,selling_price,reorder_level,barcode,status,supplier_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
  const names = [['LAP-001','Laptop Pro','14 inch business laptop',1,'Nova','pcs',48000,58000,5,'890100001','ACTIVE',1],['MON-002','LED Monitor','27 inch IPS monitor',1,'Nova','pcs',12500,15000,8,'890100002','ACTIVE',1],['KEY-003','Wireless Keyboard','Slim wireless keyboard',1,'Keywell','pcs',900,1490,12,'890100003','ACTIVE',2],['CHR-004','USB-C Charger','65W fast charger',1,'Volt','pcs',1200,1990,10,'890100004','ACTIVE',2],['CHR-005','Ergonomic Chair','Mesh office chair',3,'Workform','pcs',5500,7990,4,'890100005','ACTIVE',4],['DSK-006','Office Desk','120 cm workstation desk',3,'Workform','pcs',8500,11990,3,'890100006','ACTIVE',4],['BOX-007','Storage Box','Heavy duty storage box',5,'PackRight','pcs',180,350,20,'890100007','ACTIVE',5],['DRL-008','Cordless Drill','18V cordless drill',4,'PowerMax','pcs',3200,4499,6,'890100008','ACTIVE',3],['PEN-009','Ballpoint Pen','Premium ballpoint pen',2,'Inky','pack',45,80,30,'890100009','ACTIVE',4],['NOT-010','Notebook','A5 ruled notebook',2,'PaperCo','pcs',65,120,25,'890100010','ACTIVE',4]]
  names.forEach(p => product.run(...p))
  const stock = db.prepare('INSERT INTO warehouse_stock(product_id,warehouse_id,quantity) VALUES (?,?,?)')
  for (let productId = 1; productId <= 10; productId++) {
    const centralQuantity = productId === 4 ? 4 : productId === 8 ? 0 : 20 + productId * 3
    const northQuantity = productId === 4 ? 2 : productId === 8 ? 0 : productId % 4 === 0 ? 2 : 10 + productId
    stock.run(productId, 1, centralQuantity)
    stock.run(productId, 2, northQuantity)
    if (productId % 3 === 0) stock.run(productId, 3, 5 + productId)
  }
  const movement = db.prepare('INSERT INTO stock_movements(product_id,warehouse_id,movement_type,quantity,previous_stock,new_stock,reference_number,reason,performed_by) VALUES (?,?,?,?,?,?,?,?,?)')
  for (let i = 1; i <= 12; i++) movement.run(i <= 10 ? i : 10, i % 3 + 1, i % 2 ? 'STOCK_IN' : 'STOCK_OUT', 5 + i, 20, 25, `REF-${1000+i}`, i % 2 ? 'Opening stock received' : 'Customer sale', 1)
}
seedDatabase()

app.use(helmet({ contentSecurityPolicy: false }))
app.use(express.json({ limit: '1mb' }))
app.use(session({ secret: process.env.SESSION_SECRET || 'development-session-secret-change-me', resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 8 * 60 * 60 * 1000 } }))

const ok = (res, data) => res.json({ success: true, data })
const error = (res, status, message) => res.status(status).json({ success: false, message })
const requireAuth = (req,res,next) => req.session.user ? next() : error(res,401,'Authentication required')
const requireAdmin = (req,res,next) => req.session.user?.role === 'ADMIN' ? next() : error(res,403,'Administrator access required')
const audit = (req, action, entity, entityId, details) => db.prepare('INSERT INTO audit_logs(user_id,action,entity,entity_id,details) VALUES(?,?,?,?,?)').run(req.session.user?.id || null,action,entity,entityId,details)

app.post('/api/auth/login',(req,res)=>{
  const { username, password } = req.body
  if (!username || !password) return error(res,400,'Username and password are required')
  const user = db.prepare('SELECT * FROM users WHERE username=? AND active=1').get(username)
  if (!user || !bcrypt.compareSync(password,user.password_hash)) return error(res,401,'Invalid username or password')
  req.session.user={id:user.id,name:user.name,username:user.username,role:user.role}
  audit(req,'LOGIN','user',user.id,'User signed in')
  ok(res,req.session.user)
})
app.post('/api/auth/logout',requireAuth,(req,res)=>req.session.destroy(()=>ok(res,{loggedOut:true})))
app.get('/api/auth/me',requireAuth,(req,res)=>ok(res,req.session.user))

app.get('/api/dashboard',requireAuth,(req,res)=>{
  const totalProducts=db.prepare("SELECT COUNT(*) c FROM products WHERE status='ACTIVE'").get().c
  const totalStock=db.prepare('SELECT COALESCE(SUM(quantity),0) c FROM warehouse_stock').get().c
  const valuation=db.prepare('SELECT COALESCE(SUM(ws.quantity*p.purchase_price),0) c FROM warehouse_stock ws JOIN products p ON p.id=ws.product_id').get().c
  const totalWarehouses=db.prepare("SELECT COUNT(*) c FROM warehouses WHERE status='ACTIVE'").get().c
  const totalSuppliers=db.prepare("SELECT COUNT(*) c FROM suppliers WHERE status='ACTIVE'").get().c
  const lowStock=db.prepare(`SELECT COUNT(*) c FROM (SELECT p.id,COALESCE(SUM(ws.quantity),0) q,p.reorder_level FROM products p LEFT JOIN warehouse_stock ws ON ws.product_id=p.id WHERE p.status='ACTIVE' GROUP BY p.id HAVING q>0 AND q<=p.reorder_level)`).get().c
  const outStock=db.prepare(`SELECT COUNT(*) c FROM (SELECT p.id,COALESCE(SUM(ws.quantity),0) q FROM products p LEFT JOIN warehouse_stock ws ON ws.product_id=p.id WHERE p.status='ACTIVE' GROUP BY p.id HAVING q<=0)`).get().c
  const categoryDistribution=db.prepare(`SELECT c.name,COUNT(p.id) count FROM categories c LEFT JOIN products p ON p.category_id=c.id AND p.status='ACTIVE' GROUP BY c.id,c.name`).all()
  const movements=db.prepare(`SELECT sm.*,p.name product_name,p.sku,w.name warehouse_name,u.name performed_name FROM stock_movements sm JOIN products p ON p.id=sm.product_id JOIN warehouses w ON w.id=sm.warehouse_id LEFT JOIN users u ON u.id=sm.performed_by ORDER BY sm.created_at DESC LIMIT 12`).all()
  const lowItems=db.prepare(`SELECT p.id,p.sku,p.name,p.reorder_level,COALESCE(SUM(ws.quantity),0) available FROM products p LEFT JOIN warehouse_stock ws ON ws.product_id=p.id WHERE p.status='ACTIVE' GROUP BY p.id HAVING available<=p.reorder_level ORDER BY available ASC LIMIT 8`).all()
  const warehouseSummary=db.prepare(`SELECT w.id,w.name,COALESCE(SUM(ws.quantity),0) stock,COALESCE(SUM(ws.quantity*p.purchase_price),0) valuation FROM warehouses w LEFT JOIN warehouse_stock ws ON ws.warehouse_id=w.id LEFT JOIN products p ON p.id=ws.product_id GROUP BY w.id,w.name`).all()
  const movementChart=db.prepare(`SELECT substr(created_at,1,10) date, SUM(CASE WHEN movement_type='STOCK_IN' THEN quantity ELSE 0 END) incoming, SUM(CASE WHEN movement_type='STOCK_OUT' THEN quantity ELSE 0 END) outgoing FROM stock_movements GROUP BY substr(created_at,1,10) ORDER BY date DESC LIMIT 14`).all().reverse()
  const transfers=db.prepare(`SELECT st.*,sw.name source_name,dw.name destination_name,u.name performed_name FROM stock_transfers st JOIN warehouses sw ON sw.id=st.source_warehouse_id JOIN warehouses dw ON dw.id=st.destination_warehouse_id LEFT JOIN users u ON u.id=st.performed_by ORDER BY st.created_at DESC LIMIT 8`).all()
  ok(res,{kpis:{totalProducts,totalStock,valuation,totalWarehouses,totalSuppliers,lowStock,outStock},categoryDistribution,movements,lowItems,warehouseSummary,movementChart,transfers})
})

app.get('/api/users',requireAuth,requireAdmin,(req,res)=>ok(res,db.prepare('SELECT id,name,username,role,active,created_at FROM users ORDER BY id').all()))
app.post('/api/users',requireAdmin,(req,res)=>{
  const {name,username,password,role='STAFF'}=req.body
  if(!name||!username||!password||!['ADMIN','STAFF'].includes(role))return error(res,400,'Valid name, username, password and role are required')
  try{const r=db.prepare('INSERT INTO users(name,username,password_hash,role) VALUES(?,?,?,?)').run(name,username,bcrypt.hashSync(password,10),role);audit(req,'CREATE','user',r.lastInsertRowid,`Created ${username}`);ok(res,{id:r.lastInsertRowid,name,username,role})}catch(e){error(res,409,e.message.includes('UNIQUE')?'Username already exists':'Could not create user')}
})
app.patch('/api/users/:id',requireAdmin,(req,res)=>{
  const user=db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);if(!user)return error(res,404,'User not found')
  const role=req.body.role||user.role,active=req.body.active===undefined?user.active:req.body.active?1:0
  db.prepare('UPDATE users SET role=?,active=? WHERE id=?').run(role,active,user.id);audit(req,'UPDATE','user',user.id,'Updated role/status');ok(res,{id:user.id,role,active})
})

app.get('/api/categories',requireAuth,(req,res)=>ok(res,db.prepare('SELECT * FROM categories ORDER BY name').all()))
app.post('/api/categories',requireAdmin,(req,res)=>{if(!req.body.name)return error(res,400,'Category name is required');try{const r=db.prepare('INSERT INTO categories(name) VALUES(?)').run(req.body.name.trim());ok(res,{id:r.lastInsertRowid,name:req.body.name.trim()})}catch(e){error(res,409,'Category already exists')}})

app.get('/api/products',requireAuth,(req,res)=>{
  const {search='',category,status='' }=req.query
  let sql=`SELECT p.*,c.name category_name,s.supplier_name,COALESCE(SUM(ws.quantity),0) available_stock FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN suppliers s ON s.id=p.supplier_id LEFT JOIN warehouse_stock ws ON ws.product_id=p.id WHERE 1=1`
  const params=[]
  if(search){sql+=' AND (p.name LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?)';params.push(`%${search}%`,`%${search}%`,`%${search}%`)}
  if(category){sql+=' AND p.category_id=?';params.push(category)}
  if(status){sql+=' AND p.status=?';params.push(status)}
  sql+=' GROUP BY p.id ORDER BY p.name'
  ok(res,db.prepare(sql).all(...params))
})
app.get('/api/products/:id',requireAuth,(req,res)=>{
  const product=db.prepare(`SELECT p.*,c.name category_name,s.supplier_name,COALESCE(SUM(ws.quantity),0) available_stock FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN suppliers s ON s.id=p.supplier_id LEFT JOIN warehouse_stock ws ON ws.product_id=p.id WHERE p.id=? GROUP BY p.id`).get(req.params.id)
  if(!product)return error(res,404,'Product not found')
  const warehouses=db.prepare(`SELECT w.id,w.name,COALESCE(ws.quantity,0) quantity FROM warehouses w LEFT JOIN warehouse_stock ws ON ws.warehouse_id=w.id AND ws.product_id=? ORDER BY w.name`).all(product.id)
  const movements=db.prepare(`SELECT sm.*,w.name warehouse_name,u.name performed_name FROM stock_movements sm JOIN warehouses w ON w.id=sm.warehouse_id LEFT JOIN users u ON u.id=sm.performed_by WHERE sm.product_id=? ORDER BY sm.created_at DESC LIMIT 30`).all(product.id)
  ok(res,{...product,warehouses,movements})
})
app.post('/api/products',requireAdmin,(req,res)=>{
  const p=req.body;if(!p.sku||!p.name)return error(res,400,'SKU and product name are required')
  try{const r=db.prepare(`INSERT INTO products(sku,name,description,category_id,brand,unit,purchase_price,selling_price,reorder_level,barcode,status,supplier_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).run(p.sku.trim(),p.name.trim(),p.description||'',p.category_id||null,p.brand||'',p.unit||'pcs',Number(p.purchase_price)||0,Number(p.selling_price)||0,Number(p.reorder_level)||0,p.barcode||'',p.status||'ACTIVE',p.supplier_id||null);audit(req,'CREATE','product',r.lastInsertRowid,p.name);ok(res,{id:r.lastInsertRowid})}catch(e){error(res,409,e.message.includes('UNIQUE')?'SKU already exists':'Could not create product')}
})
app.put('/api/products/:id',requireAdmin,(req,res)=>{
  const p=db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);if(!p)return error(res,404,'Product not found')
  const b=req.body
  try{db.prepare(`UPDATE products SET sku=?,name=?,description=?,category_id=?,brand=?,unit=?,purchase_price=?,selling_price=?,reorder_level=?,barcode=?,status=?,supplier_id=? WHERE id=?`).run(b.sku||p.sku,b.name||p.name,b.description??p.description,b.category_id||null,b.brand||p.brand,b.unit||p.unit,Number(b.purchase_price??p.purchase_price),Number(b.selling_price??p.selling_price),Number(b.reorder_level??p.reorder_level),b.barcode??p.barcode,b.status||p.status,b.supplier_id||null,p.id);audit(req,'UPDATE','product',p.id,p.name);ok(res,{id:p.id})}catch(e){error(res,409,e.message.includes('UNIQUE')?'SKU already exists':'Could not update product')}
})
app.patch('/api/products/:id/status',requireAdmin,(req,res)=>{
  const {status}=req.body
  if(!['ACTIVE','ARCHIVED'].includes(status))return error(res,400,'Status must be ACTIVE or ARCHIVED')
  const product=db.prepare('SELECT id,name FROM products WHERE id=?').get(req.params.id)
  if(!product)return error(res,404,'Product not found')
  db.prepare('UPDATE products SET status=? WHERE id=?').run(status,product.id)
  audit(req,status==='ARCHIVED'?'ARCHIVE':'UNARCHIVE','product',product.id,`${product.name} set to ${status}`)
  ok(res,{id:product.id,status})
})
app.delete('/api/products/:id',requireAdmin,(req,res)=>{
  const product=db.prepare('SELECT id,name FROM products WHERE id=?').get(req.params.id)
  if(!product)return error(res,404,'Product not found')
  db.prepare("UPDATE products SET status='ARCHIVED' WHERE id=?").run(product.id)
  audit(req,'ARCHIVE','product',product.id,`${product.name} archived`)
  ok(res,{archived:true})
})

app.get('/api/warehouses',requireAuth,(req,res)=>ok(res,db.prepare(`SELECT w.*,COALESCE(SUM(ws.quantity),0) stock,COALESCE(SUM(ws.quantity*p.purchase_price),0) valuation FROM warehouses w LEFT JOIN warehouse_stock ws ON ws.warehouse_id=w.id LEFT JOIN products p ON p.id=ws.product_id GROUP BY w.id ORDER BY w.name`).all()))
app.post('/api/warehouses',requireAdmin,(req,res)=>{
  const w=req.body;if(!w.name)return error(res,400,'Warehouse name is required')
  const r=db.prepare('INSERT INTO warehouses(name,location,address,manager_name,contact_number,status) VALUES(?,?,?,?,?,?)').run(w.name,w.location||'',w.address||'',w.manager_name||'',w.contact_number||'',w.status||'ACTIVE');audit(req,'CREATE','warehouse',r.lastInsertRowid,w.name);ok(res,{id:r.lastInsertRowid})
})
app.put('/api/warehouses/:id',requireAdmin,(req,res)=>{
  const w=db.prepare('SELECT * FROM warehouses WHERE id=?').get(req.params.id);if(!w)return error(res,404,'Warehouse not found');const b=req.body
  db.prepare('UPDATE warehouses SET name=?,location=?,address=?,manager_name=?,contact_number=?,status=? WHERE id=?').run(b.name||w.name,b.location??w.location,b.address??w.address,b.manager_name??w.manager_name,b.contact_number??w.contact_number,b.status||w.status,w.id);audit(req,'UPDATE','warehouse',w.id,w.name);ok(res,{id:w.id})
})
app.get('/api/warehouses/:id',requireAuth,(req,res)=>{
  const warehouse=db.prepare('SELECT * FROM warehouses WHERE id=?').get(req.params.id);if(!warehouse)return error(res,404,'Warehouse not found')
  const inventory=db.prepare(`SELECT p.id,p.sku,p.name,p.purchase_price,COALESCE(ws.quantity,0) quantity FROM products p LEFT JOIN warehouse_stock ws ON ws.product_id=p.id AND ws.warehouse_id=? WHERE p.status='ACTIVE' ORDER BY p.name`).all(req.params.id)
  ok(res,{...warehouse,inventory})
})

app.get('/api/suppliers',requireAuth,(req,res)=>ok(res,db.prepare(`SELECT s.*,COUNT(p.id) product_count FROM suppliers s LEFT JOIN products p ON p.supplier_id=s.id GROUP BY s.id ORDER BY s.supplier_name`).all()))
app.post('/api/suppliers',requireAdmin,(req,res)=>{
  const s=req.body;if(!s.supplier_name)return error(res,400,'Supplier name is required')
  const r=db.prepare('INSERT INTO suppliers(supplier_name,company_name,email,phone,address,contact_person,status) VALUES(?,?,?,?,?,?,?)').run(s.supplier_name,s.company_name||'',s.email||'',s.phone||'',s.address||'',s.contact_person||'',s.status||'ACTIVE');audit(req,'CREATE','supplier',r.lastInsertRowid,s.supplier_name);ok(res,{id:r.lastInsertRowid})
})
app.put('/api/suppliers/:id',requireAdmin,(req,res)=>{
  const s=db.prepare('SELECT * FROM suppliers WHERE id=?').get(req.params.id);if(!s)return error(res,404,'Supplier not found');const b=req.body
  db.prepare('UPDATE suppliers SET supplier_name=?,company_name=?,email=?,phone=?,address=?,contact_person=?,status=? WHERE id=?').run(b.supplier_name||s.supplier_name,b.company_name??s.company_name,b.email??s.email,b.phone??s.phone,b.address??s.address,b.contact_person??s.contact_person,b.status||s.status,s.id);ok(res,{id:s.id})
})

app.post('/api/stock-movement',requireAuth,(req,res)=>{
  const {product_id,warehouse_id,movement_type,quantity,reference_number='',reason='',notes=''}=req.body
  const qty=Number(quantity)
  if(!product_id||!warehouse_id||!['STOCK_IN','STOCK_OUT','STOCK_ADJUSTMENT'].includes(movement_type)||!Number.isInteger(qty)||qty===0)return error(res,400,'Valid product, warehouse, movement type and quantity are required')
  if(movement_type==='STOCK_OUT'&&qty<0)return error(res,400,'Stock Out quantity must be positive')
  if(movement_type==='STOCK_IN'&&qty<0)return error(res,400,'Stock In quantity must be positive')
  if(movement_type==='STOCK_ADJUSTMENT'&&qty===0)return error(res,400,'Adjustment quantity cannot be zero')
  const tx=db.transaction(()=>{
    const stock=db.prepare('SELECT quantity FROM warehouse_stock WHERE product_id=? AND warehouse_id=?').get(product_id,warehouse_id)
    const previous=stock?.quantity||0
    const delta=movement_type==='STOCK_ADJUSTMENT'?qty:(movement_type==='STOCK_IN'?qty:-qty)
    const next=previous+delta
    if(next<0)throw new Error('Insufficient stock')
    if(stock)db.prepare('UPDATE warehouse_stock SET quantity=?,updated_at=CURRENT_TIMESTAMP WHERE product_id=? AND warehouse_id=?').run(next,product_id,warehouse_id)
    else db.prepare('INSERT INTO warehouse_stock(product_id,warehouse_id,quantity) VALUES(?,?,?)').run(product_id,warehouse_id,next)
    db.prepare('INSERT INTO stock_movements(product_id,warehouse_id,movement_type,quantity,previous_stock,new_stock,reference_number,reason,notes,performed_by) VALUES(?,?,?,?,?,?,?,?,?,?)').run(product_id,warehouse_id,movement_type,movement_type==='STOCK_ADJUSTMENT'?delta:qty,previous,next,reference_number,reason,notes,req.session.user.id)
  })
  try{tx();audit(req,'MOVEMENT',`product:${product_id}`,product_id,`${movement_type} in warehouse ${warehouse_id}`);ok(res,{success:true})}catch(e){error(res,400,e.message)}
})
app.get('/api/stock-movements',requireAuth,(req,res)=>{
  const {warehouse,product,movement_type}=req.query
  let sql=`SELECT sm.*,p.name product_name,p.sku,w.name warehouse_name,u.name performed_name FROM stock_movements sm JOIN products p ON p.id=sm.product_id JOIN warehouses w ON w.id=sm.warehouse_id LEFT JOIN users u ON u.id=sm.performed_by WHERE 1=1`;const params=[]
  if(warehouse){sql+=' AND sm.warehouse_id=?';params.push(warehouse)}if(product){sql+=' AND sm.product_id=?';params.push(product)}if(movement_type){sql+=' AND sm.movement_type=?';params.push(movement_type)}
  sql+=' ORDER BY sm.created_at DESC LIMIT 200';ok(res,db.prepare(sql).all(...params))
})

app.post('/api/transfers',requireAuth,(req,res)=>{
  const {source_warehouse_id,destination_warehouse_id,product_id,quantity,reference_number='',notes='',items}=req.body
  const transferItems=Array.isArray(items)&&items.length?items:[{product_id,quantity}]
  if(!source_warehouse_id||!destination_warehouse_id||source_warehouse_id===destination_warehouse_id)return error(res,400,'Source and destination warehouses must be different')
  if(transferItems.some(i=>!i.product_id||Number(i.quantity)<=0))return error(res,400,'Transfer items require a product and positive quantity')
  const tx=db.transaction(()=>{
    for(const item of transferItems){
      const source=db.prepare('SELECT quantity FROM warehouse_stock WHERE product_id=? AND warehouse_id=?').get(item.product_id,source_warehouse_id)
      const qty=Number(item.quantity),available=source?.quantity||0
      if(qty>available)throw new Error(`Insufficient stock for product ${item.product_id}`)
      db.prepare('UPDATE warehouse_stock SET quantity=?,updated_at=CURRENT_TIMESTAMP WHERE product_id=? AND warehouse_id=?').run(available-qty,item.product_id,source_warehouse_id)
      const destination=db.prepare('SELECT quantity FROM warehouse_stock WHERE product_id=? AND warehouse_id=?').get(item.product_id,destination_warehouse_id)
      db.prepare(destination?'UPDATE warehouse_stock SET quantity=?,updated_at=CURRENT_TIMESTAMP WHERE product_id=? AND warehouse_id=?':'INSERT INTO warehouse_stock(product_id,warehouse_id,quantity) VALUES(?,?,?)').run(destination?destination.quantity+qty:qty,destination?item.product_id:item.product_id,destination?source_warehouse_id:destination_warehouse_id)
    }
  })
  // Separate transaction is necessary to create transfer and movement records atomically with balances.
  const fullTx=db.transaction(()=>{
    for(const item of transferItems){
      const source=db.prepare('SELECT quantity FROM warehouse_stock WHERE product_id=? AND warehouse_id=?').get(item.product_id,source_warehouse_id)
      const qty=Number(item.quantity),available=source?.quantity||0
      if(qty>available)throw new Error(`Insufficient stock for product ${item.product_id}`)
      db.prepare('UPDATE warehouse_stock SET quantity=?,updated_at=CURRENT_TIMESTAMP WHERE product_id=? AND warehouse_id=?').run(available-qty,item.product_id,source_warehouse_id)
      const destination=db.prepare('SELECT quantity FROM warehouse_stock WHERE product_id=? AND warehouse_id=?').get(item.product_id,destination_warehouse_id)
      db.prepare(destination?'UPDATE warehouse_stock SET quantity=?,updated_at=CURRENT_TIMESTAMP WHERE product_id=? AND warehouse_id=?':'INSERT INTO warehouse_stock(product_id,warehouse_id,quantity) VALUES(?,?,?)').run(destination?destination.quantity+qty:qty,destination?item.product_id:item.product_id,destination?source_warehouse_id:destination_warehouse_id)
    }
    const r=db.prepare('INSERT INTO stock_transfers(source_warehouse_id,destination_warehouse_id,reference_number,notes,performed_by) VALUES(?,?,?,?,?)').run(source_warehouse_id,destination_warehouse_id,reference_number,notes,req.session.user.id)
    for(const item of transferItems){
      db.prepare('INSERT INTO stock_transfer_items(transfer_id,product_id,quantity) VALUES(?,?,?)').run(r.lastInsertRowid,item.product_id,Number(item.quantity))
      const sourceBefore=db.prepare('SELECT quantity FROM warehouse_stock WHERE product_id=? AND warehouse_id=?').get(item.product_id,source_warehouse_id)
      const destinationBefore=db.prepare('SELECT quantity FROM warehouse_stock WHERE product_id=? AND warehouse_id=?').get(item.product_id,destination_warehouse_id)
      db.prepare('INSERT INTO stock_movements(product_id,warehouse_id,movement_type,quantity,previous_stock,new_stock,reference_number,reason,performed_by) VALUES(?,?,?,?,?,?,?,?,?)').run(item.product_id,source_warehouse_id,'STOCK_OUT',Number(item.quantity),sourceBefore.quantity+Number(item.quantity),sourceBefore.quantity,reference_number,'Warehouse transfer',req.session.user.id)
      db.prepare('INSERT INTO stock_movements(product_id,warehouse_id,movement_type,quantity,previous_stock,new_stock,reference_number,reason,performed_by) VALUES(?,?,?,?,?,?,?,?,?)').run(item.product_id,destination_warehouse_id,'STOCK_IN',Number(item.quantity),destinationBefore.quantity-Number(item.quantity),destinationBefore.quantity,reference_number,'Warehouse transfer received',req.session.user.id)
    }
    return r.lastInsertRowid
  })
  try{const id=fullTx();audit(req,'TRANSFER','transfer',id,'Warehouse transfer completed');ok(res,{id})}catch(e){error(res,400,e.message)}
})
app.get('/api/transfers',requireAuth,(req,res)=>{
  const rows=db.prepare(`SELECT st.*,sw.name source_name,dw.name destination_name,u.name performed_name,COUNT(sti.id) item_count FROM stock_transfers st JOIN warehouses sw ON sw.id=st.source_warehouse_id JOIN warehouses dw ON dw.id=st.destination_warehouse_id LEFT JOIN users u ON u.id=st.performed_by LEFT JOIN stock_transfer_items sti ON sti.transfer_id=st.id GROUP BY st.id ORDER BY st.created_at DESC`).all()
  ok(res,rows)
})

app.get('/api/alerts',requireAuth,(req,res)=>{
  const low=db.prepare(`SELECT p.id,p.sku,p.name,p.reorder_level,COALESCE(SUM(ws.quantity),0) available,p.purchase_price FROM products p LEFT JOIN warehouse_stock ws ON ws.product_id=p.id WHERE p.status='ACTIVE' GROUP BY p.id HAVING available<=p.reorder_level ORDER BY available ASC`).all().map(p=>({...p,suggested_reorder_quantity:Math.max(0,p.reorder_level-p.available)}))
  ok(res,low)
})

app.get('/api/reports/:type',requireAuth,(req,res)=>{
  const type=req.params.type
  if(type==='inventory')return ok(res,db.prepare(`SELECT p.sku,p.name,c.name category_name,COALESCE(SUM(ws.quantity),0) quantity,COALESCE(SUM(ws.quantity*p.purchase_price),0) valuation FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN warehouse_stock ws ON ws.product_id=p.id WHERE p.status='ACTIVE' GROUP BY p.id ORDER BY valuation DESC`).all())
  if(type==='movements')return ok(res,db.prepare(`SELECT sm.*,p.sku,p.name product_name,w.name warehouse_name,u.name performed_name FROM stock_movements sm JOIN products p ON p.id=sm.product_id JOIN warehouses w ON w.id=sm.warehouse_id LEFT JOIN users u ON u.id=sm.performed_by ORDER BY sm.created_at DESC`).all())
  if(type==='warehouses')return ok(res,db.prepare(`SELECT w.name,COALESCE(SUM(ws.quantity),0) quantity,COALESCE(SUM(ws.quantity*p.purchase_price),0) valuation FROM warehouses w LEFT JOIN warehouse_stock ws ON ws.warehouse_id=w.id LEFT JOIN products p ON p.id=ws.product_id GROUP BY w.id`).all())
  if(type==='low-stock')return res.redirect('/api/alerts')
  if(type==='suppliers')return ok(res,db.prepare(`SELECT s.*,COUNT(p.id) product_count FROM suppliers s LEFT JOIN products p ON p.supplier_id=s.id GROUP BY s.id`).all())
  if(type==='transfers')return ok(res,db.prepare(`SELECT st.*,sw.name source_name,dw.name destination_name,p.name product_name,sti.quantity FROM stock_transfers st JOIN warehouses sw ON sw.id=st.source_warehouse_id JOIN warehouses dw ON dw.id=st.destination_warehouse_id JOIN stock_transfer_items sti ON sti.transfer_id=st.id JOIN products p ON p.id=sti.product_id`).all())
  error(res,400,'Unknown report type')
})

app.get('/api/reports/csv/:type',requireAuth,(req,res)=>{
  const type=req.params.type
  let rows=[]
  if(type==='inventory')rows=db.prepare(`SELECT p.sku,p.name,COALESCE(SUM(ws.quantity),0) quantity,COALESCE(SUM(ws.quantity*p.purchase_price),0) valuation FROM products p LEFT JOIN warehouse_stock ws ON ws.product_id=p.id GROUP BY p.id`).all()
  else if(type==='movements')rows=db.prepare(`SELECT p.sku,p.name product_name,sm.movement_type,sm.quantity,sm.reference_number,sm.created_at FROM stock_movements sm JOIN products p ON p.id=sm.product_id`).all()
  else if(type==='low-stock')rows=db.prepare(`SELECT p.sku,p.name,p.reorder_level,COALESCE(SUM(ws.quantity),0) available FROM products p LEFT JOIN warehouse_stock ws ON ws.product_id=p.id GROUP BY p.id HAVING available<=p.reorder_level`).all()
  if(!rows.length)return res.status(404).send('No report data')
  const keys=Object.keys(rows[0])
  const csv=[keys.join(','),...rows.map(r=>keys.map(k=>`"${String(r[k]??'').replace(/"/g,'""')}"`).join(','))].join('\n')
  res.setHeader('Content-Type','text/csv');res.setHeader('Content-Disposition',`attachment; filename="${type}-report.csv"`);res.send(csv)
})

app.use('/assets',express.static(path.join(__dirname,'dist','assets')))
app.use(express.static(path.join(__dirname,'dist')))
app.get('/{*splat}',(req,res)=>{
  const index=path.join(__dirname,'dist','index.html')
  fs.existsSync(index)?res.sendFile(index):res.sendStatus(404)
})
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({success:false,message:'Internal server error'})})

const port=Number(process.env.PORT||3000)
app.listen(port,()=>console.log(`MANAGE YOUR INVENTORY running at http://localhost:${port}`))
