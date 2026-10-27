import React, { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { Activity, Beaker, CalendarDays, CheckCircle2, Clock3, FlaskConical, LogOut, Package, Plus, Search, ShieldCheck, UserRound, XCircle, Wrench } from 'lucide-react';

const blankEquipment = { name:'', code:'', category:'Electronics', location:'', description:'', quantity:1, status:'available', instructions:'' };
const pretty = value => value ? new Date(value).toLocaleString([], { dateStyle:'medium', timeStyle:'short' }) : '—';
const statusClass = s => `status status-${s}`;
function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('lab_user')); } catch { return null; } });
  const [page, setPage] = useState('equipment');
  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All categories');
  const [authMode, setAuthMode] = useState('login');
  const [auth, setAuth] = useState({ name:'', email:'', password:'', studentId:'', department:'' });
  const [selected, setSelected] = useState(null);
  const [bookingForm, setBookingForm] = useState({ startAt:'', endAt:'', purpose:'', courseCode:'' });
  const [equipmentForm, setEquipmentForm] = useState(blankEquipment);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const isAdmin = user?.role === 'admin';

  const flash = (message, type='success') => { setNotice({ message, type }); window.setTimeout(() => setNotice(null), 4200); };
  async function refresh() {
    try {
      const [eq] = await Promise.all([api('/equipment')]);
      setEquipment(eq.equipment || []);
      if (user) {
        const mine = await api('/bookings/mine');
        setBookings(mine.bookings || []);
        if (user.role === 'admin') {
          const all = await api('/bookings');
          setAllBookings(all.bookings || []);
        }
      }
    } catch (e) { if (user) flash(e.message, 'error'); }
  }
  useEffect(() => { refresh(); }, [user?.id]);
  const categories = useMemo(() => ['All categories', ...new Set(equipment.map(x => x.category))], [equipment]);
  const filtered = equipment.filter(x => {
    const match = `${x.name} ${x.code} ${x.location} ${x.description}`.toLowerCase().includes(search.toLowerCase());
    return match && (category === 'All categories' || x.category === category);
  });
  const activeBookings = bookings.filter(b => ['pending','approved'].includes(b.status)).length;
  const stats = [
    { label:'Equipment items', value:equipment.length, icon:Package },
    { label:'Available items', value:equipment.filter(x => x.status === 'available').length, icon:CheckCircle2 },
    { label:'My active bookings', value:activeBookings, icon:CalendarDays }
  ];
  function setLoggedIn(data) {
    localStorage.setItem('lab_token', data.token); localStorage.setItem('lab_user', JSON.stringify(data.user));
    setUser(data.user); setPage('equipment'); flash('Welcome to LabReserve.');
  }
  async function submitAuth(e) {
    e.preventDefault(); setBusy(true);
    try {
      const path = authMode === 'login' ? '/auth/login' : '/auth/register';
      const data = await api(path, { method:'POST', body:JSON.stringify(auth) });
      setLoggedIn(data);
    } catch (e) { flash(e.message, 'error'); }
    finally { setBusy(false); }
  }
  function logout() {
    localStorage.removeItem('lab_token'); localStorage.removeItem('lab_user'); setUser(null); setBookings([]); setAllBookings([]); setPage('equipment');
  }
  async function submitBooking(e) {
    e.preventDefault(); setBusy(true);
    try {
      await api('/bookings', { method:'POST', body:JSON.stringify({ equipmentId:selected._id, ...bookingForm }) });
      setSelected(null); setBookingForm({ startAt:'', endAt:'', purpose:'', courseCode:'' }); flash('Booking request submitted. Await admin approval.'); await refresh();
    } catch (e) { flash(e.message, 'error'); }
    finally { setBusy(false); }
  }
  async function cancelBooking(id) {
    try { await api(`/bookings/${id}/cancel`, { method:'PATCH' }); flash('Booking cancelled.'); await refresh(); }
    catch (e) { flash(e.message, 'error'); }
  }
  async function changeStatus(id, status) {
    try { await api(`/bookings/${id}/status`, { method:'PATCH', body:JSON.stringify({ status }) }); flash(`Booking ${status}.`); await refresh(); }
    catch (e) { flash(e.message, 'error'); }
  }
  async function saveEquipment(e) {
    e.preventDefault(); setBusy(true);
    try {
      const path = editing ? `/equipment/${editing}` : '/equipment';
      await api(path, { method:editing ? 'PUT' : 'POST', body:JSON.stringify({ ...equipmentForm, quantity:Number(equipmentForm.quantity) }) });
      setEquipmentForm(blankEquipment); setEditing(null); flash(editing ? 'Equipment updated.' : 'Equipment added.'); await refresh();
    } catch (e) { flash(e.message, 'error'); }
    finally { setBusy(false); }
  }
  async function deleteEquipment(item) {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    try { await api(`/equipment/${item._id}`, { method:'DELETE' }); flash('Equipment deleted.'); await refresh(); }
    catch (e) { flash(e.message, 'error'); }
  }
  function editEquipment(item) { setEditing(item._id); setEquipmentForm({ ...blankEquipment, ...item }); setPage('manage'); window.scrollTo({ top:0, behavior:'smooth' }); }
  const nav = [
    { id:'equipment', label:'Equipment', icon:Package },
    ...(user ? [{ id:'my-bookings', label:'My bookings', icon:CalendarDays }] : []),
    ...(isAdmin ? [{ id:'admin-bookings', label:'Manage bookings', icon:ShieldCheck }, { id:'manage', label:'Manage equipment', icon:Wrench }] : [])
  ];
  if (!user) return <div className="auth-shell">
    <div className="auth-visual"><div className="brand brand-light"><span className="brand-icon"><FlaskConical size={22}/></span><span>LabReserve</span></div><div className="auth-hero"><span className="eyebrow">SMART LAB MANAGEMENT</span><h1>Research starts with the right equipment.</h1><p>Find laboratory tools, reserve a time slot, and keep your practical work moving.</p><div className="hero-points"><span><CheckCircle2 size={17}/> Live availability</span><span><CheckCircle2 size={17}/> Simple reservations</span><span><CheckCircle2 size={17}/> One shared workspace</span></div></div><div className="visual-footer">LABORATORY EQUIPMENT PORTAL <span>•</span> STUDENT ACCESS</div></div>
    <div className="auth-panel"><div className="auth-card"><div className="mobile-brand brand"><span className="brand-icon"><FlaskConical size={22}/></span><span>LabReserve</span></div><span className="eyebrow">WELCOME {authMode === 'login' ? 'BACK' : 'ABOARD'}</span><h2>{authMode === 'login' ? 'Sign in to your account' : 'Create your account'}</h2><p className="muted">{authMode === 'login' ? 'Access your lab bookings and equipment.' : 'Register as a student to request equipment.'}</p>
    <form onSubmit={submitAuth} className="form-stack">
      {authMode === 'register' && <><label>Full name<input required value={auth.name} onChange={e=>setAuth({...auth,name:e.target.value})} placeholder="Your full name"/></label><label>Student ID <span className="optional">(optional)</span><input value={auth.studentId} onChange={e=>setAuth({...auth,studentId:e.target.value})} placeholder="e.g. ENG/22/001"/></label><label>Department <span className="optional">(optional)</span><input value={auth.department} onChange={e=>setAuth({...auth,department:e.target.value})} placeholder="e.g. Computer Engineering"/></label></>}
      <label>Email address<input required type="email" value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value})} placeholder="you@university.edu"/></label>
      <label>Password<input required minLength="8" type="password" value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})} placeholder="At least 8 characters"/></label>
      <button className="btn btn-primary btn-full" disabled={busy}>{busy ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account'} <span>→</span></button>
    </form><div className="auth-switch">{authMode === 'login' ? "Don't have an account?" : 'Already registered?'} <button onClick={()=>setAuthMode(authMode==='login'?'register':'login')}>{authMode==='login'?'Create account':'Sign in'}</button></div><div className="secure-note"><ShieldCheck size={15}/> Your account is protected with secure authentication.</div></div></div>
    {notice && <div className={`toast ${notice.type}`}>{notice.message}</div>}
  </div>;

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-icon"><FlaskConical size={22}/></span><span>LabReserve</span></div><div className="side-caption">WORKSPACE</div><nav>{nav.map(n=><button key={n.id} className={`nav-item ${page===n.id?'active':''}`} onClick={()=>setPage(n.id)}><n.icon size={18}/>{n.label}{n.id==='my-bookings'&&activeBookings>0&&<span className="nav-count">{activeBookings}</span>}</button>)}</nav><div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Activity size={18}/></div><strong>Need lab support?</strong><p>Contact your lab technician for equipment assistance.</p></div><div className="user-mini"><div className="avatar">{user.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}</div><div className="user-mini-text"><strong>{user.name}</strong><span>{isAdmin?'Administrator':'Student'}</span></div><button className="icon-btn" title="Sign out" onClick={logout}><LogOut size={17}/></button></div></div></aside>
    <main className="main-content"><header className="topbar"><div><span className="breadcrumb">Workspace <span>/</span> {nav.find(n=>n.id===page)?.label || 'Equipment'}</span><h1>{page==='equipment'?'Equipment catalogue':page==='my-bookings'?'My bookings':page==='admin-bookings'?'Booking requests':'Equipment management'}</h1></div><div className="top-user"><div className="online-dot"></div><span>{user.name}</span><div className="avatar small">{user.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}</div></div></header>
    {notice && <div className={`toast inline-toast ${notice.type}`}><span>{notice.message}</span><button onClick={()=>setNotice(null)}><XCircle size={17}/></button></div>}
    {page==='equipment' && <>
      <section className="welcome-banner"><div className="banner-copy"><span className="eyebrow">YOUR LAB, ORGANIZED</span><h2>Good work starts with good tools.</h2><p>Explore equipment and book the resources you need for your next experiment.</p></div><div className="banner-art"><div className="orb orb-one"></div><div className="orb orb-two"></div><FlaskConical size={112} strokeWidth={1.1}/><span className="art-spark spark-one">✳</span><span className="art-spark spark-two">✦</span></div></section>
      <section className="stats-grid">{stats.map(s=><div className="stat-card" key={s.label}><div className="stat-icon"><s.icon size={20}/></div><div><span>{s.label}</span><strong>{s.value}</strong></div></div>)}</section>
      <section className="section-head"><div><h2>Find equipment</h2><p className="muted">Check availability before reserving a time slot.</p></div><div className="filter-bar"><div className="searchbox"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search equipment…"/></div><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></div></section>
      {filtered.length===0 ? <div className="empty-state"><Package size={32}/><h3>No equipment found</h3><p>Try another search or category.</p></div> : <div className="equipment-grid">{filtered.map(item=><article className="equipment-card" key={item._id}><div className={`equipment-illustration illustration-${item.category.toLowerCase().replace(/[^a-z]/g,'')}`}><span className="category-pill">{item.category}</span><div className="equipment-symbol">{item.category.toLowerCase().includes('computer')||item.category.toLowerCase().includes('electronic')?'⌁':item.category.toLowerCase().includes('safety')?'✣':'⚗'}</div><span className="equipment-code">{item.code}</span></div><div className="equipment-body"><div className="equipment-title-row"><h3>{item.name}</h3><span className={statusClass(item.status)}><i></i>{item.status}</span></div><p className="equipment-desc">{item.description || 'Laboratory equipment available for academic use.'}</p><div className="equipment-meta"><span><Package size={15}/>{item.quantity} unit{item.quantity===1?'':'s'}</span><span><Activity size={15}/>{item.location}</span></div>{item.status!=='available'&&<div className="maintenance-note"><Wrench size={14}/> Not bookable right now</div>}<div className="equipment-footer"><span className="availability-text"><span className={`availability-dot ${item.status==='available'?'green':'gray'}`}></span>{item.status==='available'?'Booking requests open':'Currently unavailable'}</span><button disabled={item.status!=='available'} className="btn btn-small btn-primary" onClick={()=>{setSelected(item);setBookingForm({startAt:'',endAt:'',purpose:'',courseCode:''})}}>Book item <span>→</span></button></div></div></article>)}</div>}
      <div className="note-strip"><ShieldCheck size={18}/><span><strong>Booking policy:</strong> Requests are pending until approved by a lab administrator. Time slots cannot overlap with another active booking.</span></div>
    </>}
    {page==='my-bookings' && <section className="content-panel"><div className="panel-heading"><div><h2>Your reservations</h2><p className="muted">Track requests and manage upcoming sessions.</p></div><span className="subtle-count">{bookings.length} total</span></div>{bookings.length===0?<div className="empty-state"><CalendarDays size={32}/><h3>No bookings yet</h3><p>Browse equipment to make your first request.</p><button className="btn btn-primary" onClick={()=>setPage('equipment')}>Browse equipment</button></div>:<div className="table-wrap"><table><thead><tr><th>Equipment</th><th>Time slot</th><th>Purpose</th><th>Status</th><th>Action</th></tr></thead><tbody>{bookings.map(b=><tr key={b._id}><td><strong>{b.equipment?.name||'Deleted equipment'}</strong><small>{b.equipment?.code||''}</small></td><td>{pretty(b.startAt)}<small>to {pretty(b.endAt)}</small></td><td>{b.purpose}</td><td><span className={statusClass(b.status)}>{b.status}</span>{b.adminNote&&<small>{b.adminNote}</small>}</td><td>{['pending','approved'].includes(b.status)?<button className="btn btn-outline btn-tiny" onClick={()=>cancelBooking(b._id)}>Cancel</button>:'—'}</td></tr>)}</tbody></table></div>}</section>}
    {page==='admin-bookings' && isAdmin && <section className="content-panel"><div className="panel-heading"><div><h2>All booking requests</h2><p className="muted">Review, approve, or reject equipment reservations.</p></div><span className="subtle-count">{allBookings.length} total</span></div>{allBookings.length===0?<div className="empty-state"><CalendarDays size={32}/><h3>No requests yet</h3></div>:<div className="table-wrap"><table><thead><tr><th>Student</th><th>Equipment</th><th>Time slot</th><th>Purpose</th><th>Status</th><th>Review</th></tr></thead><tbody>{allBookings.map(b=><tr key={b._id}><td><strong>{b.user?.name||'Student'}</strong><small>{b.user?.email}</small><small>{b.user?.studentId}</small></td><td><strong>{b.equipment?.name||'Deleted equipment'}</strong><small>{b.equipment?.code}</small></td><td>{pretty(b.startAt)}<small>to {pretty(b.endAt)}</small></td><td>{b.purpose}</td><td><span className={statusClass(b.status)}>{b.status}</span></td><td><div className="table-actions">{b.status==='pending'&&<><button className="btn btn-tiny btn-primary" onClick={()=>changeStatus(b._id,'approved')}>Approve</button><button className="btn btn-tiny btn-danger" onClick={()=>changeStatus(b._id,'rejected')}>Reject</button></>}{b.status==='approved'&&<button className="btn btn-tiny btn-outline" onClick={()=>changeStatus(b._id,'completed')}>Complete</button>}</div></td></tr>)}</tbody></table></div>}</section>}
    {page==='manage' && isAdmin && <section className="manage-layout"><div className="content-panel"><div className="panel-heading"><div><h2>{editing?'Edit equipment':'Add equipment'}</h2><p className="muted">Keep the lab catalogue up to date.</p></div>{editing&&<button className="btn btn-outline btn-tiny" onClick={()=>{setEditing(null);setEquipmentForm(blankEquipment)}}>Cancel edit</button>}</div><form className="equipment-form" onSubmit={saveEquipment}><label>Equipment name<input required value={equipmentForm.name} onChange={e=>setEquipmentForm({...equipmentForm,name:e.target.value})} placeholder="e.g. Digital Oscilloscope"/></label><div className="form-row"><label>Asset code<input required value={equipmentForm.code} onChange={e=>setEquipmentForm({...equipmentForm,code:e.target.value})} placeholder="LAB-EQ-001"/></label><label>Category<select value={equipmentForm.category} onChange={e=>setEquipmentForm({...equipmentForm,category:e.target.value})}>{['Electronics','Measurement','Computer Equipment','Optics','Safety','Chemistry','Mechanical','Other'].map(c=><option key={c}>{c}</option>)}</select></label></div><div className="form-row"><label>Lab location<input required value={equipmentForm.location} onChange={e=>setEquipmentForm({...equipmentForm,location:e.target.value})} placeholder="Lab A, Shelf 2"/></label><label>Quantity<input required min="1" type="number" value={equipmentForm.quantity} onChange={e=>setEquipmentForm({...equipmentForm,quantity:e.target.value})}/></label></div><label>Description<textarea rows="3" value={equipmentForm.description} onChange={e=>setEquipmentForm({...equipmentForm,description:e.target.value})} placeholder="Describe the item and intended use…"/></label><label>Usage instructions<textarea rows="2" value={equipmentForm.instructions} onChange={e=>setEquipmentForm({...equipmentForm,instructions:e.target.value})} placeholder="Safety or handover instructions…"/></label><label>Booking status<select value={equipmentForm.status} onChange={e=>setEquipmentForm({...equipmentForm,status:e.target.value})}><option value="available">Available</option><option value="maintenance">Under maintenance</option><option value="retired">Retired</option></select></label><button className="btn btn-primary" disabled={busy}>{busy?'Saving…':editing?'Save changes':'Add equipment'} <Plus size={16}/></button></form></div><div className="content-panel equipment-list-panel"><div className="panel-heading"><div><h2>Equipment inventory</h2><p className="muted">{equipment.length} registered items</p></div></div>{equipment.map(item=><div className="inventory-row" key={item._id}><div className="inventory-symbol"><Beaker size={20}/></div><div className="inventory-info"><strong>{item.name}</strong><span>{item.code} · {item.location}</span></div><div className="inventory-actions"><button className="icon-btn" title="Edit" onClick={()=>editEquipment(item)}>✎</button><button className="icon-btn danger-icon" title="Delete" onClick={()=>deleteEquipment(item)}><XCircle size={17}/></button></div></div>)}</div></section>}
    <footer className="page-footer"><span>© {new Date().getFullYear()} LabReserve</span><span>Laboratory Equipment Booking System <span className="footer-dot">•</span> Built for campus labs</span></footer>
    </main>
    {selected && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><div className="booking-modal"><div className="modal-top"><div><span className="eyebrow">NEW RESERVATION</span><h2>Book {selected.name}</h2><p className="muted">{selected.code} · {selected.location}</p></div><button className="icon-btn" onClick={()=>setSelected(null)}><XCircle size={20}/></button></div><div className="modal-info"><Clock3 size={18}/><span>Choose a future time. Your request must be approved by a lab administrator.</span></div><form className="form-stack" onSubmit={submitBooking}><label>Start date & time<input required type="datetime-local" min={new Date(Date.now()+60000).toISOString().slice(0,16)} value={bookingForm.startAt} onChange={e=>setBookingForm({...bookingForm,startAt:e.target.value})}/></label><label>End date & time<input required type="datetime-local" min={bookingForm.startAt||new Date().toISOString().slice(0,16)} value={bookingForm.endAt} onChange={e=>setBookingForm({...bookingForm,endAt:e.target.value})}/></label><label>Course / module code <span className="optional">(optional)</span><input value={bookingForm.courseCode} onChange={e=>setBookingForm({...bookingForm,courseCode:e.target.value})} placeholder="e.g. EEXXXX"/></label><label>Purpose of use<textarea required rows="3" maxLength="500" value={bookingForm.purpose} onChange={e=>setBookingForm({...bookingForm,purpose:e.target.value})} placeholder="Briefly describe your experiment or practical…"/></label><div className="modal-actions"><button type="button" className="btn btn-outline" onClick={()=>setSelected(null)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy?'Submitting…':'Submit request'} <span>→</span></button></div></form></div></div>}
  </div>;
}
export default App;
