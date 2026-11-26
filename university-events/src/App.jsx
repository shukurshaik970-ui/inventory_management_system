import { useCallback, useEffect, useRef, useState } from 'react'
import Chart from 'chart.js/auto'
import './login.css'
import './warehouse.css'
import './status.css'
import './notifications.css'

const currentYear = new Date().getFullYear()

const api = async (url, options={}) => {
  const response = await fetch(url,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}})
  const data = await response.json()
  if(!response.ok) throw new Error(data.message || 'Request failed')
  return data.data
}

const money = value => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(value||0)

function Login({onLogin}) {
  const [form,setForm]=useState({username:'',password:''})
  const [error,setError]=useState('')
  const [showPassword,setShowPassword]=useState(false)
  const [busy,setBusy]=useState(false)
  const [capsLock,setCapsLock]=useState(false)
  const [activeDetail,setActiveDetail]=useState(0)
  const [showAccessInfo,setShowAccessInfo]=useState(false)
  const features=[
    {icon:'▦',title:'Inventory control',detail:'Keep product levels visible across every warehouse, with reorder alerts when stock runs low.'},
    {icon:'⇄',title:'Movement tracking',detail:'Record incoming stock, outgoing stock, adjustments and transfers with a clear audit history.'},
    {icon:'▥',title:'Operational insight',detail:'Review live stock valuation, warehouse summaries and movement reports from one workspace.'},
  ]
  const submit=async e=>{
    e.preventDefault()
    setError('')
    setBusy(true)
    try{onLogin(await api('/api/auth/login',{method:'POST',body:JSON.stringify(form)}))}catch(e){setError(e.message)}finally{setBusy(false)}
  }
  return <main className="login-page">
    <section className="login-showcase">
      <div className="showcase-top"><div className="side-brand"><div className="brand-mark small">MYS</div><div><strong>MANAGE</strong><span>YOUR INVENTORY</span></div></div><span className="showcase-live"><i/> OPERATIONS PLATFORM</span></div>
      <div className="showcase-copy"><div className="eyebrow">INVENTORY, IN GOOD ORDER</div><h1>Every detail.<br/><em>In its place.</em></h1><p>A calmer way to manage products, warehouses and the movement of your stock.</p></div>
      <div className="showcase-window">
        <div className="window-heading"><div><span className="window-dots"><i/><i/><i/></span><strong>Workspace overview</strong></div><span className="window-tag">LIVE WORKSPACE</span></div>
        <div className="window-content"><div className="window-sidebar"><b>MYS</b><i/><i/><i/><i/></div><div className="window-main"><div className="window-greeting"><span>YOUR OPERATIONS</span><strong>Everything, at a glance.</strong></div><div className="window-metrics"><div><i className="metric-icon">▦</i><span>PRODUCTS</span><b>Organised</b></div><div><i className="metric-icon gold-icon">▰</i><span>LOCATIONS</span><b>Connected</b></div><div><i className="metric-icon blue-icon">⇄</i><span>MOVEMENTS</span><b>Recorded</b></div></div><div className="window-chart"><span>Stock movement history</span><div className="chart-lines"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></div></div></div>
      </div>
      <div className="showcase-detail">
        <div className="detail-tabs" aria-label="Platform features">{features.map((feature,index)=><button type="button" aria-pressed={activeDetail===index} className={activeDetail===index?'selected':''} key={feature.title} onClick={()=>setActiveDetail(index)}><span>{feature.icon}</span>{feature.title}</button>)}</div>
        <div className="detail-copy"><span className="detail-icon">{features[activeDetail].icon}</span><div><strong>{features[activeDetail].title}</strong><p>{features[activeDetail].detail}</p></div></div>
      </div>
      <div className="showcase-footer"><span>BUILT FOR CLEARER OPERATIONS</span><span>SECURE · CONNECTED · ACCOUNTABLE</span></div>
    </section>
    <section className="login-panel">
      <form className="login-card" onSubmit={submit}>
        <div className="login-card-top"><span className="eyebrow">YOUR PRIVATE WORKSPACE</span><span className="secure-label"><i/> ENCRYPTED SESSION</span></div>
        <h2>Welcome back</h2><p className="login-intro">Sign in to continue to your inventory workspace.</p>
        {error&&<div className="alert error" role="alert">{error}</div>}
        <label htmlFor="login-username">Username<input id="login-username" autoComplete="username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder="Enter your username" required /></label>
        <label htmlFor="login-password">Password<div className="password-field"><input id="login-password" type={showPassword?'text':'password'} autoComplete="current-password" value={form.password} onKeyUp={e=>setCapsLock(e.getModifierState('CapsLock'))} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Enter your password" required/><button type="button" className="password-toggle" aria-label={showPassword?'Hide password':'Show password'} aria-pressed={showPassword} onClick={()=>setShowPassword(!showPassword)}>{showPassword?'HIDE':'SHOW'}</button></div>{capsLock&&<span className="caps-warning">Caps Lock is on</span>}</label>
        <button className="primary wide login-submit" type="submit" disabled={busy}>{busy?<><span className="button-spinner"/>Verifying access...</>:'Sign in to workspace'}<span aria-hidden="true">→</span></button>
        <div className="access-help"><span>Need help accessing your account?</span><button type="button" onClick={()=>setShowAccessInfo(!showAccessInfo)} aria-expanded={showAccessInfo}>{showAccessInfo?'Hide details':'View access details'}</button></div>
        {showAccessInfo&&<div className="access-details"><strong>Account access</strong><p>Your administrator manages workspace accounts and permissions. Contact them if you need an account or password reset.</p><p>Administrator and staff access is protected by role-based permissions.</p></div>}
        <div className="login-security"><span>◈</span> Your sign-in is protected by a secure session.</div>
      </form>
      <div className="login-panel-footer">© {currentYear} MANAGE YOUR INVENTORY <span>·</span> PRIVATE BUSINESS ACCESS</div>
    </section>
  </main>
}

function Modal({title,children,onClose}) {
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal" onMouseDown={e=>e.stopPropagation()}><header><h2>{title}</h2><button className="icon-button" onClick={onClose}>×</button></header>{children}</section></div>
}

function Toast({message,onDismiss}) {
  const isUnarchived=message==='Product Unarchived'
  useEffect(()=>{
    const dismissTimer=setTimeout(onDismiss,2300)
    return ()=>clearTimeout(dismissTimer)
  },[message,onDismiss])
  return message?<div className="toast-screen" role="status" aria-live="polite"><div className="toast-card"><span className="toast-check" aria-hidden="true"><svg className="toast-ring" viewBox="0 0 42 42"><path d={isUnarchived?'M21 2 A19 19 0 0 0 21 40 A19 19 0 0 0 21 2':'M21 2 A19 19 0 0 1 21 40 A19 19 0 0 1 21 2'}/></svg>✓</span><strong>{message}</strong></div></div>:null
}

function Sidebar({page,setPage,user,onLogout}) {
  const items=[['dashboard','Dashboard','⌂'],['products','Products','▦'],['warehouses','Warehouses','▰'],['suppliers','Suppliers','♙'],['movements','Stock Movements','⇅'],['transfers','Transfers','⇆'],['alerts','Low Stock','!'],['reports','Reports','▥']]
  if(user.role==='ADMIN') items.push(['users','Users','◎'])
  return <aside className="sidebar"><div className="side-brand"><div className="brand-mark small">MYS</div><div><strong>MANAGE</strong><span>YOUR INVENTORY</span></div></div>
    <nav>{items.map(([id,label,icon])=><button key={id} className={page===id?'active':''} onClick={()=>setPage(id)}><span className="nav-icon">{icon}</span>{label}</button>)}</nav>
    <div className="side-user"><div className="avatar">{user.name?.[0]||'U'}</div><div><strong>{user.name}</strong><span>{user.role}</span></div><button className="logout" onClick={onLogout} title="Logout">↪</button></div>
  </aside>
}

function PageHead({title,subtitle,action}) {
  return <header className="page-head"><div><div className="eyebrow">OPERATIONS</div><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>{action}</header>
}

function Dashboard() {
  const [data,setData]=useState(null)
  const chartRefs=useRef([])
  useEffect(()=>{api('/api/dashboard').then(setData).catch(()=>{})},[])
  useEffect(()=>{
    if(!data)return
    chartRefs.current.forEach(c=>c?.destroy());chartRefs.current=[]
    const movement=document.querySelector('#movementChart')
    const category=document.querySelector('#categoryChart')
    if(movement) chartRefs.current.push(new Chart(movement,{type:'bar',data:{labels:data.movementChart.map(x=>x.date.slice(5)),datasets:[{label:'Incoming',data:data.movementChart.map(x=>x.incoming),backgroundColor:'#174a37',borderRadius:5},{label:'Outgoing',data:data.movementChart.map(x=>x.outgoing),backgroundColor:'#c7a969',borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:true,grid:{color:'#edf0ed'}}}}}))
    if(category) chartRefs.current.push(new Chart(category,{type:'doughnut',data:{labels:data.categoryDistribution.map(x=>x.name),datasets:[{data:data.categoryDistribution.map(x=>x.count),backgroundColor:['#174a37','#c7a969','#6e8377','#d7d2c5','#87978f']}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{position:'bottom'}}}}))
  },[data])
  if(!data)return <div className="loading">Loading dashboard...</div>
  const k=data.kpis
  const cards=[['Total Products',k.totalProducts,'▦','green'],['Total Stock Units',k.totalStock,'▣','blue'],['Inventory Valuation',money(k.valuation),'$','gold'],['Warehouses',k.totalWarehouses,'▰','green'],['Suppliers',k.totalSuppliers,'♙','blue'],['Low Stock',k.lowStock,'!','gold'],['Out of Stock',k.outStock,'×','red']]
  return <><PageHead title="Dashboard" subtitle="A complete overview of your inventory operations"/>
    <section className="kpi-grid">{cards.map(([label,value,icon,theme])=><article className="kpi-card" key={label}><div className={`kpi-icon ${theme}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong></div></article>)}</section>
    <section className="chart-grid"><article className="panel"><header><div><span className="panel-kicker">MOVEMENTS</span><h3>Stock in vs stock out</h3></div></header><div className="chart-box"><canvas id="movementChart"></canvas></div></article><article className="panel"><header><span className="panel-kicker">CATEGORIES</span><h3>Product distribution</h3></header><div className="chart-box"><canvas id="categoryChart"></canvas></div></article></section>
    <section className="dashboard-grid">
      <article className="panel"><header><div><span className="panel-kicker">WAREHOUSES</span><h3>Warehouse stock summary</h3></div></header><table><thead><tr><th>Warehouse</th><th>Stock</th><th>Valuation</th></tr></thead><tbody>{data.warehouseSummary.map(w=><tr key={w.id}><td>{w.name}</td><td>{w.stock}</td><td>{money(w.valuation)}</td></tr>)}</tbody></table></article>
      <article className="panel"><header><div><span className="panel-kicker">ALERTS</span><h3>Low-stock items</h3></div></header><table><thead><tr><th>Product</th><th>Available</th><th>Reorder</th></tr></thead><tbody>{data.lowItems.map(p=><tr key={p.id}><td><strong>{p.name}</strong><small>{p.sku}</small></td><td><span className="stock-badge">{p.available}</span></td><td>{p.reorder_level}</td></tr>)}</tbody></table></article>
    </section>
    <section className="panel"><header><div><span className="panel-kicker">ACTIVITY</span><h3>Recent stock movements</h3></div></header><div className="table-scroll"><table><thead><tr><th>Reference</th><th>Product</th><th>Warehouse</th><th>Type</th><th>Quantity</th><th>User</th></tr></thead><tbody>{data.movements.map(m=><tr key={m.id}><td>{m.reference_number||`MOV-${m.id}`}</td><td>{m.product_name}</td><td>{m.warehouse_name}</td><td><span className={`status ${m.movement_type==='STOCK_OUT'?'danger':'success'}`}>{m.movement_type.replace('_',' ')}</span></td><td>{m.quantity}</td><td>{m.performed_name||'System'}</td></tr>)}</tbody></table></div></section>
  </>
}

function Products({user,onNotify}) {
  const [rows,setRows]=useState([]),[categories,setCategories]=useState([]),[suppliers,setSuppliers]=useState([]),[search,setSearch]=useState(''),[statusFilter,setStatusFilter]=useState('ALL'),[modal,setModal]=useState(false)
  const blank={sku:'',name:'',description:'',category_id:'',brand:'',unit:'pcs',purchase_price:'',selling_price:'',reorder_level:'',barcode:'',status:'ACTIVE',supplier_id:''}
  const [form,setForm]=useState(blank),[editing,setEditing]=useState(null)
  const load=useCallback(()=>{
    const params=new URLSearchParams({search})
    if(statusFilter!=='ALL')params.set('status',statusFilter)
    return api(`/api/products?${params}`).then(setRows)
  },[search,statusFilter])
  useEffect(()=>{load()},[load])
  useEffect(()=>{api('/api/categories').then(setCategories);api('/api/suppliers').then(setSuppliers)},[])
  const open=(p=null)=>{setEditing(p?.id||null);setForm(p?{...p,category_id:p.category_id||'',supplier_id:p.supplier_id||''}:blank);setModal(true)}
  const save=async e=>{e.preventDefault();try{await api(editing?`/api/products/${editing}`:'/api/products',{method:editing?'PUT':'POST',body:JSON.stringify(form)});setModal(false);onNotify('Saved Successfully');load()}catch(e){alert(e.message)}}
  const changeStatus=async p=>{
    const status=p.status==='ACTIVE'?'ARCHIVED':'ACTIVE'
    if(status==='ARCHIVED'&&!confirm(`Archive ${p.name}? You can unarchive it later.`))return
    try{await api(`/api/products/${p.id}/status`,{method:'PATCH',body:JSON.stringify({status})});onNotify(status==='ACTIVE'?'Product Unarchived':'Product Archived');load()}catch(e){alert(e.message)}
  }
  return <><PageHead title="Products" subtitle="Manage product details, pricing and reorder levels" action={user.role==='ADMIN'&&<button className="primary" onClick={()=>open()}>＋ Add product</button>}/>
    <section className="toolbar"><input placeholder="Search SKU, name or brand..." value={search} onChange={e=>setSearch(e.target.value)}/><select aria-label="Filter products by status" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option></select><span>{rows.length} products</span></section>
    <section className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Purchase</th><th>Selling</th><th>Status</th>{user.role==='ADMIN'&&<th></th>}</tr></thead><tbody>{rows.map(p=><tr key={p.id}><td><strong>{p.name}</strong><small>{p.brand}</small></td><td>{p.sku}</td><td>{p.category_name||'—'}</td><td><span className={`stock-badge ${p.available_stock<=p.reorder_level?'danger':''}`}>{p.available_stock}</span></td><td>{money(p.purchase_price)}</td><td>{money(p.selling_price)}</td><td><span className={`status ${p.status==='ACTIVE'?'success':p.status==='ARCHIVED'?'archived':'muted'} ${p.status==='ACTIVE'?'status-dot':p.status==='INACTIVE'?'status-dot inactive':''}`}>{p.status==='ARCHIVED'?'Archived':p.status}</span></td>{user.role==='ADMIN'&&<td><button className="link" onClick={()=>open(p)}>Edit</button><button className={`link ${p.status==='ACTIVE'?'danger':''}`} onClick={()=>changeStatus(p)}>{p.status==='ACTIVE'?'Archive':'Unarchive'}</button></td>}</tr>)}</tbody></table></div></section>
    {modal&&<Modal title={editing?'Edit product':'Add product'} onClose={()=>setModal(false)}><form className="form-grid" onSubmit={save}>{[['sku','SKU'],['name','Product name'],['brand','Brand'],['barcode','Barcode'],['unit','Unit'],['purchase_price','Purchase price'],['selling_price','Selling price'],['reorder_level','Reorder level']].map(([key,label])=><label key={key}>{label}<input type={['purchase_price','selling_price','reorder_level'].includes(key)?'number':'text'} required={key==='sku'||key==='name'} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}<label>Category<select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Select category</option>{categories.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label>Supplier<select value={form.supplier_id} onChange={e=>setForm({...form,supplier_id:e.target.value})}><option value="">Select supplier</option>{suppliers.map(s=><option value={s.id} key={s.id}>{s.supplier_name}</option>)}</select></label><label className="full">Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><div className="form-actions full"><button type="button" className="secondary" onClick={()=>setModal(false)}>Cancel</button><button className="primary" type="submit">Save product</button></div></form></Modal>}
  </>
}

function WarehouseMark() {
  return <span className="warehouse-icon" aria-hidden="true">
    <svg viewBox="0 0 32 32" fill="none">
      <path d="m4 13 12-8 12 8v14H4V13Z"/>
      <path d="M10 27v-9h12v9M9 13h14"/>
    </svg>
  </span>
}

function Warehouses({user,onNotify}) {
  const [rows,setRows]=useState([]),[modal,setModal]=useState(false),[form,setForm]=useState({name:'',location:'',address:'',manager_name:'',contact_number:'',status:'ACTIVE'}),[editing,setEditing]=useState(null)
  const load=()=>api('/api/warehouses').then(setRows)
  useEffect(()=>{api('/api/warehouses').then(setRows)},[])
  const open=w=>{setEditing(w?.id||null);setForm(w||{name:'',location:'',address:'',manager_name:'',contact_number:'',status:'ACTIVE'});setModal(true)}
  const save=async e=>{e.preventDefault();try{await api(editing?`/api/warehouses/${editing}`:'/api/warehouses',{method:editing?'PUT':'POST',body:JSON.stringify(form)});setModal(false);load();onNotify('Saved Successfully')}catch(e){alert(e.message)}}
  return <><PageHead title="Warehouses" subtitle="Manage locations and warehouse-level inventory" action={user.role==='ADMIN'&&<button className="primary" onClick={()=>open()}>＋ Add warehouse</button>}/>
    <section className="warehouse-grid">{rows.map(w=><article className="warehouse-card" key={w.id}><WarehouseMark/><div className="warehouse-main"><span className={`status ${w.status==='ACTIVE'?'success':'muted'} ${w.status==='ACTIVE'?'status-dot':w.status==='INACTIVE'?'status-dot inactive':''}`}>{w.status}</span><h3>{w.name}</h3><p>{w.location}</p></div><div className="warehouse-stats"><div><span>Stock units</span><strong>{w.stock}</strong></div><div><span>Valuation</span><strong>{money(w.valuation)}</strong></div></div>{user.role==='ADMIN'&&<button className="secondary" onClick={()=>open(w)}>Manage</button>}</article>)}</section>
    {modal&&<Modal title={editing?'Edit warehouse':'Add warehouse'} onClose={()=>setModal(false)}><form className="form-grid" onSubmit={save}>{[['name','Warehouse name'],['location','Location'],['address','Address'],['manager_name','Manager'],['contact_number','Contact number']].map(([key,label])=><label key={key}>{label}<input required={key==='name'} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}<label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>ACTIVE</option><option>INACTIVE</option></select></label><div className="form-actions full"><button type="button" className="secondary" onClick={()=>setModal(false)}>Cancel</button><button className="primary">Save warehouse</button></div></form></Modal>}
  </>
}

function Suppliers({user,onNotify}) {
  const [rows,setRows]=useState([]),[modal,setModal]=useState(false),[form,setForm]=useState({supplier_name:'',company_name:'',email:'',phone:'',address:'',contact_person:'',status:'ACTIVE'}),[editing,setEditing]=useState(null)
  const load=()=>api('/api/suppliers').then(setRows);useEffect(()=>{api('/api/suppliers').then(setRows)},[])
  const open=s=>{setEditing(s?.id||null);setForm(s||{supplier_name:'',company_name:'',email:'',phone:'',address:'',contact_person:'',status:'ACTIVE'});setModal(true)}
  const save=async e=>{e.preventDefault();try{await api(editing?`/api/suppliers/${editing}`:'/api/suppliers',{method:editing?'PUT':'POST',body:JSON.stringify(form)});setModal(false);load();onNotify('Saved Successfully')}catch(e){alert(e.message)}}
  return <><PageHead title="Suppliers" subtitle="Maintain vendor and supplier relationships" action={user.role==='ADMIN'&&<button className="primary" onClick={()=>open()}>＋ Add supplier</button>}/>
    <section className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Supplier</th><th>Contact</th><th>Email</th><th>Phone</th><th>Products</th><th>Status</th>{user.role==='ADMIN'&&<th></th>}</tr></thead><tbody>{rows.map(s=><tr key={s.id}><td><strong>{s.supplier_name}</strong><small>{s.company_name}</small></td><td>{s.contact_person||'—'}</td><td>{s.email||'—'}</td><td>{s.phone||'—'}</td><td>{s.product_count}</td><td><span className={`status ${s.status==='ACTIVE'?'success':'muted'} ${s.status==='ACTIVE'?'status-dot':s.status==='INACTIVE'?'status-dot inactive':''}`}>{s.status}</span></td>{user.role==='ADMIN'&&<td><button className="link" onClick={()=>open(s)}>Edit</button></td>}</tr>)}</tbody></table></div></section>
    {modal&&<Modal title={editing?'Edit supplier':'Add supplier'} onClose={()=>setModal(false)}><form className="form-grid" onSubmit={save}>{[['supplier_name','Supplier name'],['company_name','Company'],['contact_person','Contact person'],['email','Email'],['phone','Phone'],['address','Address']].map(([key,label])=><label key={key}>{label}<input required={key==='supplier_name'} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}<label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>ACTIVE</option><option>ARCHIVED</option></select></label><div className="form-actions full"><button type="button" className="secondary" onClick={()=>setModal(false)}>Cancel</button><button className="primary">Save supplier</button></div></form></Modal>}
  </>
}

function StockMovements({user,onNotify}) {
  const [rows,setRows]=useState([]),[products,setProducts]=useState([]),[warehouses,setWarehouses]=useState([]),[modal,setModal]=useState(false)
  const [form,setForm]=useState({product_id:'',warehouse_id:'',movement_type:'STOCK_IN',quantity:'',reference_number:'',reason:'',notes:''})
  const load=()=>api('/api/stock-movements').then(setRows)
  useEffect(()=>{load();api('/api/products').then(setProducts);api('/api/warehouses').then(setWarehouses)},[])
  const save=async e=>{e.preventDefault();try{await api('/api/stock-movement',{method:'POST',body:JSON.stringify({...form,quantity:Number(form.quantity)})});setModal(false);load();onNotify('Saved Successfully')}catch(e){alert(e.message)}}
  return <><PageHead title="Stock movements" subtitle="Record incoming, outgoing and adjusted inventory" action={<button className="primary" onClick={()=>setModal(true)}>＋ New movement</button>}/>
    <section className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Reference</th><th>Date</th><th>Product</th><th>Warehouse</th><th>Type</th><th>Previous</th><th>New</th><th>Quantity</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.reference_number||`MOV-${r.id}`}</td><td>{r.created_at?.slice(0,16).replace('T',' ')}</td><td><strong>{r.product_name}</strong><small>{r.sku}</small></td><td>{r.warehouse_name}</td><td><span className={`status ${r.movement_type==='STOCK_OUT'?'danger':'success'}`}>{r.movement_type.replaceAll('_',' ')}</span></td><td>{r.previous_stock}</td><td>{r.new_stock}</td><td>{r.quantity}</td></tr>)}</tbody></table></div></section>
    {modal&&<Modal title="Record stock movement" onClose={()=>setModal(false)}><form className="form-grid" onSubmit={save}><label>Product<select required value={form.product_id} onChange={e=>setForm({...form,product_id:e.target.value})}><option value="">Select product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}</select></label><label>Warehouse<select required value={form.warehouse_id} onChange={e=>setForm({...form,warehouse_id:e.target.value})}><option value="">Select warehouse</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label><label>Movement type<select value={form.movement_type} onChange={e=>setForm({...form,movement_type:e.target.value})}><option>STOCK_IN</option><option>STOCK_OUT</option><option>STOCK_ADJUSTMENT</option></select></label><label>Quantity<input type="number" required value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/><small>{form.movement_type==='STOCK_ADJUSTMENT'?'Use a positive or negative balance difference':''}</small></label><label>Reference<input value={form.reference_number} onChange={e=>setForm({...form,reference_number:e.target.value})}/></label><label>Reason<input value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/></label><label className="full">Notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label><div className="form-actions full"><button type="button" className="secondary" onClick={()=>setModal(false)}>Cancel</button><button className="primary">Record movement</button></div></form></Modal>}
  </>
}

function Transfers({onNotify}) {
  const [rows,setRows]=useState([]),[products,setProducts]=useState([]),[warehouses,setWarehouses]=useState([]),[modal,setModal]=useState(false)
  const [form,setForm]=useState({source_warehouse_id:'',destination_warehouse_id:'',product_id:'',quantity:'',reference_number:'',notes:''})
  const load=()=>api('/api/transfers').then(setRows)
  useEffect(()=>{load();api('/api/products').then(setProducts);api('/api/warehouses').then(setWarehouses)},[])
  const save=async e=>{e.preventDefault();try{await api('/api/transfers',{method:'POST',body:JSON.stringify({...form,quantity:Number(form.quantity)})});setModal(false);load();onNotify('Saved Successfully')}catch(e){alert(e.message)}}
  return <><PageHead title="Warehouse transfers" subtitle="Move stock securely between warehouse locations" action={<button className="primary" onClick={()=>setModal(true)}>＋ Create transfer</button>}/>
    <section className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Transfer</th><th>Date</th><th>Source</th><th>Destination</th><th>Items</th><th>Status</th><th>Created by</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td><strong>{r.reference_number||`TRF-${r.id}`}</strong></td><td>{r.created_at?.slice(0,16).replace('T',' ')}</td><td>{r.source_name}</td><td>{r.destination_name}</td><td>{r.item_count}</td><td><span className="status success status-dot">{r.status}</span></td><td>{r.performed_name}</td></tr>)}</tbody></table></div></section>
    {modal&&<Modal title="Create warehouse transfer" onClose={()=>setModal(false)}><form className="form-grid" onSubmit={save}><label>Source warehouse<select required value={form.source_warehouse_id} onChange={e=>setForm({...form,source_warehouse_id:e.target.value})}><option value="">Select source</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label><label>Destination warehouse<select required value={form.destination_warehouse_id} onChange={e=>setForm({...form,destination_warehouse_id:e.target.value})}><option value="">Select destination</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label><label>Product<select required value={form.product_id} onChange={e=>setForm({...form,product_id:e.target.value})}><option value="">Select product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Quantity<input type="number" min="1" required value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/></label><label>Reference<input value={form.reference_number} onChange={e=>setForm({...form,reference_number:e.target.value})}/></label><label className="full">Transfer notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label><div className="form-actions full"><button type="button" className="secondary" onClick={()=>setModal(false)}>Cancel</button><button className="primary">Complete transfer</button></div></form></Modal>}
  </>
}

function Alerts() {
  const [rows,setRows]=useState([]);useEffect(()=>{api('/api/alerts').then(setRows)},[])
  return <><PageHead title="Low-stock alerts" subtitle="Products that require replenishment"/>
    <section className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Product</th><th>Available</th><th>Reorder level</th><th>Suggested reorder</th><th>Status</th></tr></thead><tbody>{rows.map(p=><tr key={p.id}><td><strong>{p.name}</strong><small>{p.sku}</small></td><td>{p.available}</td><td>{p.reorder_level}</td><td>{p.suggested_reorder_quantity}</td><td><span className={`status ${p.available===0?'danger':'gold'}`}>{p.available===0?'OUT OF STOCK':'LOW STOCK'}</span></td></tr>)}</tbody></table></div></section>
  </>
}

function Reports() {
  const [type,setType]=useState('inventory'),[rows,setRows]=useState([])
  useEffect(()=>{api(`/api/reports/${type==='low-stock'?type:type}`).then(setRows).catch(()=>setRows([]))},[type])
  const exportCsv=()=>window.open(`/api/reports/csv/${type}`,'_blank')
  const title={inventory:'Inventory valuation',movements:'Stock movements',warehouses:'Warehouse inventory','low-stock':'Low-stock report',suppliers:'Supplier report',transfers:'Stock transfers'}[type]
  return <><PageHead title="Reports & analytics" subtitle="Generate operational and financial reports" action={<><button className="secondary" onClick={()=>window.print()}>Print</button><button className="primary" onClick={exportCsv}>Export CSV</button></>}/>
    <section className="toolbar"><select value={type} onChange={e=>setType(e.target.value)}><option value="inventory">Inventory valuation</option><option value="movements">Stock movements</option><option value="warehouses">Warehouse inventory</option><option value="low-stock">Low-stock report</option><option value="suppliers">Supplier report</option><option value="transfers">Stock transfers</option></select></section>
    <section className="panel table-panel"><header><h3>{title}</h3><p className="muted">Inventory turnover is calculated in reports using outbound quantity divided by average inventory for the selected period.</p></header><div className="table-scroll"><table><thead><tr>{rows[0]&&Object.keys(rows[0]).filter(k=>!['id','category_name','supplier_name','source_name','destination_name','performed_name','product_name','sku'].includes(k)&&k!=='source_warehouse_id'&&k!=='destination_warehouse_id').map(k=><th key={k}>{k.replaceAll('_',' ')}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{Object.entries(r).filter(([k])=>!['id','category_name','supplier_name','source_name','destination_name','performed_name','product_name','sku'].includes(k)&&k!=='source_warehouse_id'&&k!=='destination_warehouse_id').map(([k,v])=><td key={k}>{k.includes('price')||k.includes('valuation')?money(v):String(v??'—')}</td>)}</tr>)}</tbody></table></div></section>
  </>
}

function Users({onNotify}) {
  const [rows,setRows]=useState([]),[modal,setModal]=useState(false),[form,setForm]=useState({name:'',username:'',password:'',role:'STAFF'})
  const load=()=>api('/api/users').then(setRows);useEffect(()=>{api('/api/users').then(setRows)},[])
  const save=async e=>{e.preventDefault();try{await api('/api/users',{method:'POST',body:JSON.stringify(form)});setModal(false);setForm({name:'',username:'',password:'',role:'STAFF'});load();onNotify('Saved Successfully')}catch(e){alert(e.message)}}
  const toggle=async u=>{try{await api(`/api/users/${u.id}`,{method:'PATCH',body:JSON.stringify({role:u.role,active:!u.active})});load();onNotify('Saved Successfully')}catch(e){alert(e.message)}}
  return <><PageHead title="User management" subtitle="Control team access and administrator permissions" action={<button className="primary" onClick={()=>setModal(true)}>＋ Add user</button>}/>
    <section className="panel table-panel"><table><thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>{rows.map(u=><tr key={u.id}><td><strong>{u.name}</strong></td><td>{u.username}</td><td><span className="status muted">{u.role}</span></td><td><span className={`status ${u.active?'success':'muted'} ${u.active?'status-dot':'status-dot inactive'}`}>{u.active?'ACTIVE':'INACTIVE'}</span></td><td><button className="link" onClick={()=>toggle(u)}>{u.active?'Deactivate':'Activate'}</button></td></tr>)}</tbody></table></section>
    {modal&&<Modal title="Create user" onClose={()=>setModal(false)}><form className="form-grid" onSubmit={save}><label>Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Username<input required value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/></label><label>Password<input type="password" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><label>Role<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option>STAFF</option><option>ADMIN</option></select></label><div className="form-actions full"><button type="button" className="secondary" onClick={()=>setModal(false)}>Cancel</button><button className="primary">Create user</button></div></form></Modal>}
  </>
}

export default function App() {
  const [user,setUser]=useState(null),[page,setPage]=useState('dashboard'),[checking,setChecking]=useState(true)
  const [notification,setNotification]=useState(null)
  const notificationId=useRef(0)
  const notify=useCallback(message=>{notificationId.current+=1;setNotification({id:notificationId.current,message})},[])
  const dismissNotification=useCallback(()=>setNotification(null),[])
  useEffect(()=>{api('/api/auth/me').then(setUser).catch(()=>setUser(null)).finally(()=>setChecking(false))},[])
  const logout=async()=>{await api('/api/auth/logout',{method:'POST'}).catch(()=>{});setUser(null)}
  if(checking)return <div className="loading">Loading...</div>
  if(!user)return <Login onLogin={setUser}/>
  const pages={dashboard:<Dashboard/>,products:<Products user={user} onNotify={notify}/>,warehouses:<Warehouses user={user} onNotify={notify}/>,suppliers:<Suppliers user={user} onNotify={notify}/>,movements:<StockMovements user={user} onNotify={notify}/>,transfers:<Transfers onNotify={notify}/>,alerts:<Alerts/>,reports:<Reports/>,users:<Users onNotify={notify}/>}
  return <div className="app-shell"><Sidebar page={page} setPage={setPage} user={user} onLogout={logout}/><main className="main-content">{pages[page]||pages.dashboard}</main>{notification&&<Toast key={notification.id} message={notification.message} onDismiss={dismissNotification}/>}</div>
}
