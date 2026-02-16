import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || ''

function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(setUser)
        .catch(() => { localStorage.removeItem('token'); setToken(null) })
    }
  }, [token])

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <div className="container">
            <Link to="/" className="logo">🐾 PetSwap</Link>
            <div className="nav-links">
              <Link to="/properties">Properties</Link>
              {user ? (
                <>
                  <Link to="/dashboard">Dashboard</Link>
                  <button onClick={logout} className="btn btn-secondary">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-secondary">Login</Link>
                  <Link to="/register" className="btn btn-primary">Register</Link>
                </>
              )}
            </div>
          </div>
        </nav>

        <main className="container">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetail token={token} />} />
            <Route path="/login" element={<Login onLogin={login} />} />
            <Route path="/register" element={<Register onLogin={login} />} />
            <Route path="/dashboard" element={user ? <Dashboard user={user} token={token} /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

function Home({ user }) {
  return (
    <div className="hero">
      <h1>Holiday House Swaps for People with Pets 🏠🐾</h1>
      <p>Your pets stay home. You holiday in each other's homes.</p>
      <div className="hero-buttons">
        <Link to="/properties" className="btn btn-primary">Browse Properties</Link>
        {user ? <Link to="/dashboard" className="btn btn-secondary">My Dashboard</Link> : <Link to="/register" className="btn btn-secondary">Join Now</Link>}
      </div>
    </div>
  )
}

function Properties() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/properties`)
      .then(res => res.json())
      .then(data => { setProperties(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="properties">
      <h2>Available Properties</h2>
      {properties.length === 0 ? (
        <p>No properties yet. Be the first to list!</p>
      ) : (
        <div className="property-grid">
          {properties.map(p => (
            <div key={p.id} className="property-card">
              <h3>{p.title}</h3>
              <p>{p.city}, {p.country}</p>
              <p>{p.bedrooms} bed • {p.bathrooms} bath</p>
              <Link to={`/properties/${p.id}`} className="btn btn-primary">View</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PropertyDetail({ token }) {
  // Simple implementation - would need route params
  return <div>Property details coming soon</div>
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    
    const data = await res.json()
    if (res.ok) {
      onLogin(data.token, data.user)
    } else {
      setError(data.error)
    }
  }

  return (
    <div className="auth-form">
      <h2>Login</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit" className="btn btn-primary">Login</button>
      </form>
    </div>
  )
}

function Register({ onLogin }) {
  const [formData, setFormData] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    
    const data = await res.json()
    if (res.ok) {
      onLogin(data.token, data.user)
    } else {
      setError(data.error)
    }
  }

  return (
    <div className="auth-form">
      <h2>Register</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <input type="text" placeholder="First Name" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
          <input type="text" placeholder="Last Name" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
        </div>
        <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
        <input type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
        <input type="tel" placeholder="Phone (optional)" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        <button type="submit" className="btn btn-primary">Register</button>
      </form>
    </div>
  )
}

function Dashboard({ user, token }) {
  const [bookings, setBookings] = useState([])
  const [showPropertyForm, setShowPropertyForm] = useState(false)
  const [propertyForm, setPropertyForm] = useState({ title: '', description: '', address: '', city: '', country: '', bedrooms: 2, bathrooms: 1, petsAllowed: 'dogs,cats' })

  useEffect(() => {
    fetch(`${API_URL}/api/bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(setBookings)
      .catch(console.error)
  }, [token])

  const handlePropertySubmit = async (e) => {
    e.preventDefault()
    
    const res = await fetch(`${API_URL}/api/properties`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ...propertyForm, amenities: [], images: [] })
    })
    
.ok) {
         if (res alert('Property listed!')
      setShowPropertyForm(false)
    }
  }

  return (
    <div className="dashboard">
      <h2>Welcome, {user.firstName}!</h2>
      
      <section>
        <h3>My Bookings</h3>
        {bookings.length === 0 ? <p>No bookings yet</p> : (
          <ul>
            {bookings.map(b => (
              <li key={b.id}>{b.property?.title} - {new Date(b.startDate).toLocaleDateString()}</li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3>List Your Property</h3>
        {!showPropertyForm ? (
          <button onClick={() => setShowPropertyForm(true)} className="btn btn-primary">Add Property</button>
        ) : (
          <form onSubmit={handlePropertyForm} className="property-form">
            <input type="text" placeholder="Title" value={propertyForm.title} onChange={e => setPropertyForm({...propertyForm, title: e.target.value})} required />
            <textarea placeholder="Description" value={propertyForm.description} onChange={e => setPropertyForm({...propertyForm, description: e.target.value})} required />
            <input type="text" placeholder="Address" value={propertyForm.address} onChange={e => setPropertyForm({...propertyForm, address: e.target.value})} required />
            <div className="form-row">
              <input type="text" placeholder="City" value={propertyForm.city} onChange={e => setPropertyForm({...propertyForm, city: e.target.value})} required />
              <input type="text" placeholder="Country" value={propertyForm.country} onChange={e => setPropertyForm({...propertyForm, country: e.target.value})} required />
            </div>
            <div className="form-row">
              <input type="number" placeholder="Bedrooms" value={propertyForm.bedrooms} onChange={e => setPropertyForm({...propertyForm, bedrooms: e.target.value})} required />
              <input type="number" placeholder="Bathrooms" value={propertyForm.bathrooms} onChange={e => setPropertyForm({...propertyForm, bathrooms: e.target.value})} required />
            </div>
            <input type="text" placeholder="Pets allowed (e.g. dogs,cats)" value={propertyForm.petsAllowed} onChange={e => setPropertyForm({...propertyForm, petsAllowed: e.target.value})} required />
            <button type="submit" className="btn btn-primary">Submit</button>
          </form>
        )}
      </section>
    </div>
  )
}

export default App
