import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || '/api'

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      apiFetch('/api/auth/me')
        .then(setUser)
        .catch(() => { localStorage.removeItem('token'); setToken(null) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-950">
        <div className="animate-pulse text-emerald-400 text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center gap-2 text-xl font-bold text-emerald-700 hover:text-emerald-600">
                <span className="text-2xl">🐾</span> PetSwap
              </Link>
              <div className="flex items-center gap-4">
                <Link to="/properties" className="text-sm text-gray-600 hover:text-gray-900">Properties</Link>
                {user ? (
                  <>
                    <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
                    <button onClick={logout} className="text-sm px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
                    <Link to="/register" className="text-sm px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={login} />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register onLogin={login} />} />
          <Route path="/dashboard" element={user ? <Dashboard user={user} token={token} /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

function Home({ user }) {
  return (
    <div className="bg-emerald-950 min-h-[calc(100vh-64px)]">
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-6">🏠🐾</div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
          Holiday House Swaps<br />for People with Pets
        </h1>
        <p className="text-xl text-emerald-200 mb-10 max-w-2xl mx-auto">
          Your pets stay in their familiar home. You holiday in each other's homes. Everyone wins.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/properties" className="px-6 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition">
            Browse Properties
          </Link>
          {user ? (
            <Link to="/dashboard" className="px-6 py-3 rounded-lg border border-emerald-400 text-emerald-300 font-medium hover:bg-emerald-900 transition">
              My Dashboard
            </Link>
          ) : (
            <Link to="/register" className="px-6 py-3 rounded-lg border border-emerald-400 text-emerald-300 font-medium hover:bg-emerald-900 transition">
              Join Now — It's Free
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function Properties() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/properties')
      .then(data => { setProperties(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Properties</h2>
      {loading ? (
        <div className="text-gray-500">Loading properties...</div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">🏡</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties listed yet</h3>
          <p className="text-gray-500 mb-6">Be the first to list your home and start swapping!</p>
          <Link to="/register" className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700">
            List Your Property
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition">
              <h3 className="text-lg font-semibold text-gray-900">{p.title}</h3>
              <p className="text-gray-500 mt-1">{p.city}, {p.country}</p>
              <div className="flex gap-3 mt-3 text-sm text-gray-600">
                <span>🛏 {p.bedrooms} bed</span>
                <span>🚿 {p.bathrooms} bath</span>
              </div>
              {p.petsAllowed && (
                <div className="mt-3 text-sm text-emerald-600">🐾 {p.petsAllowed}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      onLogin(data.token, data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-emerald-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <span className="text-5xl">🐾</span>
            <div>
              <h1 className="text-2xl font-bold text-white">PetSwap</h1>
              <p className="text-sm text-emerald-300">Holiday Home Exchange</p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-200">
          <div className="p-6 pb-2 text-center">
            <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account to continue</p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="w-full px-3 py-2 rounded-md border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-emerald-600 hover:text-emerald-500 hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Register({ onLogin }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', phone: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || undefined,
        }),
      })
      onLogin(data.token, data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-emerald-950 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <span className="text-5xl">🐾</span>
            <div>
              <h1 className="text-2xl font-bold text-white">PetSwap</h1>
              <p className="text-sm text-emerald-300">Holiday Home Exchange</p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-200">
          <div className="p-6 pb-2 text-center">
            <h2 className="text-xl font-semibold text-gray-900">Create your account</h2>
            <p className="text-sm text-gray-500 mt-1">Get started with PetSwap</p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First name</label>
                  <input
                    id="firstName"
                    placeholder="Mat"
                    value={form.firstName}
                    onChange={update('firstName')}
                    autoComplete="given-name"
                    required
                    className="w-full px-3 py-2 rounded-md border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last name</label>
                  <input
                    id="lastName"
                    placeholder="Harvey"
                    value={form.lastName}
                    onChange={update('lastName')}
                    autoComplete="family-name"
                    required
                    className="w-full px-3 py-2 rounded-md border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={update('email')}
                  autoComplete="email"
                  required
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 8 characters"
                    value={form.password}
                    onChange={update('password')}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm password</label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Type your password again"
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  autoComplete="new-password"
                  required
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone <span className="text-gray-400">(optional)</span></label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+61 400 000 000"
                  value={form.phone}
                  onChange={update('phone')}
                  autoComplete="tel"
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Dashboard({ user, token }) {
  const [bookings, setBookings] = useState([])
  const [properties, setProperties] = useState([])
  const [showPropertyForm, setShowPropertyForm] = useState(false)
  const [propertyForm, setPropertyForm] = useState({
    title: '', description: '', address: '', city: '', country: 'Australia',
    bedrooms: 2, bathrooms: 1, petsAllowed: 'dogs,cats'
  })
  const [submitLoading, setSubmitLoading] = useState(false)

  useEffect(() => {
    apiFetch('/api/bookings').then(setBookings).catch(console.error)
    apiFetch('/api/properties').then(setProperties).catch(console.error)
  }, [token])

  const handlePropertySubmit = async (e) => {
    e.preventDefault()
    setSubmitLoading(true)
    try {
      await apiFetch('/api/properties', {
        method: 'POST',
        body: JSON.stringify({ ...propertyForm, amenities: [], images: [] }),
      })
      setShowPropertyForm(false)
      setPropertyForm({ title: '', description: '', address: '', city: '', country: 'Australia', bedrooms: 2, bathrooms: 1, petsAllowed: 'dogs,cats' })
      // Refresh properties
      const updated = await apiFetch('/api/properties')
      setProperties(updated)
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.firstName}! 👋</h1>
        <p className="text-gray-500 mt-1">Manage your properties and bookings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bookings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Bookings</h2>
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">📅</div>
              <p className="text-gray-500">No bookings yet</p>
              <Link to="/properties" className="text-sm text-emerald-600 hover:underline mt-2 inline-block">Browse properties</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map(b => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{b.property?.title}</p>
                    <p className="text-sm text-gray-500">{new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Properties */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">My Properties</h2>
            {!showPropertyForm && (
              <button
                onClick={() => setShowPropertyForm(true)}
                className="text-sm px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
              >
                + Add Property
              </button>
            )}
          </div>

          {showPropertyForm ? (
            <form onSubmit={handlePropertySubmit} className="space-y-3">
              <input type="text" placeholder="Property title" value={propertyForm.title} onChange={e => setPropertyForm({...propertyForm, title: e.target.value})} required className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <textarea placeholder="Description" value={propertyForm.description} onChange={e => setPropertyForm({...propertyForm, description: e.target.value})} required rows={3} className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input type="text" placeholder="Address" value={propertyForm.address} onChange={e => setPropertyForm({...propertyForm, address: e.target.value})} required className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="City" value={propertyForm.city} onChange={e => setPropertyForm({...propertyForm, city: e.target.value})} required className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="text" placeholder="Country" value={propertyForm.country} onChange={e => setPropertyForm({...propertyForm, country: e.target.value})} required className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bedrooms</label>
                  <input type="number" value={propertyForm.bedrooms} onChange={e => setPropertyForm({...propertyForm, bedrooms: e.target.value})} required className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bathrooms</label>
                  <input type="number" value={propertyForm.bathrooms} onChange={e => setPropertyForm({...propertyForm, bathrooms: e.target.value})} required className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Pets</label>
                  <input type="text" placeholder="dogs,cats" value={propertyForm.petsAllowed} onChange={e => setPropertyForm({...propertyForm, petsAllowed: e.target.value})} required className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitLoading} className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                  {submitLoading ? 'Saving...' : 'Save Property'}
                </button>
                <button type="button" onClick={() => setShowPropertyForm(false)} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          ) : properties.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">🏡</div>
              <p className="text-gray-500">No properties listed yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {properties.map(p => (
                <div key={p.id} className="p-3 rounded-lg bg-gray-50">
                  <p className="font-medium text-gray-900">{p.title}</p>
                  <p className="text-sm text-gray-500">{p.city}, {p.country} · {p.bedrooms} bed · {p.bathrooms} bath</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
