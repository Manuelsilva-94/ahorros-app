import { useMemo, useState, type CSSProperties } from 'react'
import './App.css'
import { useAuth } from './AuthContext'
import { useGoals, useContributions } from './useFirestore'

type LocalGoal = { id: string; name: string; target: number }
type LocalContribution = { id: string; date: string; amount: number; note: string }

function App() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth()
  const {
    goals,
    loading: goalsLoading,
    addGoal,
    updateGoal,
    deleteGoal,
  } = useGoals()
  const {
    contributions,
    loading: contributionsLoading,
    addContribution,
    updateContribution,
    deleteContribution,
  } = useContributions()

  const [screen, setScreen] = useState<'goals' | 'savings'>('goals')
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [editGoalName, setEditGoalName] = useState('')
  const [editGoalTarget, setEditGoalTarget] = useState('')
  const [newGoalName, setNewGoalName] = useState('')
  const [newGoalTarget, setNewGoalTarget] = useState('')
  const [newContributionAmount, setNewContributionAmount] = useState('')
  const [newContributionDate, setNewContributionDate] = useState('')
  const [newContributionNote, setNewContributionNote] = useState('')
  const [editingContributionId, setEditingContributionId] = useState<string | null>(null)
  const [editContributionAmount, setEditContributionAmount] = useState('')
  const [editContributionDate, setEditContributionDate] = useState('')
  const [editContributionNote, setEditContributionNote] = useState('')
  const [confirmModal, setConfirmModal] = useState<{
    kind: 'goal' | 'contribution'
    id: string
    name: string
  } | null>(null)
  const [activeModal, setActiveModal] = useState<'addGoal' | 'addContribution' | null>(
    null
  )

  const totalSaved = useMemo(() => {
    return contributions.reduce((sum, item) => sum + item.amount, 0)
  }, [contributions])

  const uniqueMonthsCount = useMemo(() => {
    const months = new Set(contributions.map((item) => item.date?.slice(0, 7)))
    return months.size
  }, [contributions])

  const averageMonthly = useMemo(() => {
    if (!totalSaved || !uniqueMonthsCount) {
      return 0
    }
    return totalSaved / uniqueMonthsCount
  }, [totalSaved, uniqueMonthsCount])

  const conservativeMonthly = averageMonthly ? averageMonthly * 0.75 : 200
  const ambitiousMonthly = averageMonthly ? averageMonthly * 1.4 : 500

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (value: string) => {
    const date = new Date(`${value}T00:00:00`)
    if (Number.isNaN(date.getTime())) {
      return value
    }
    return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(date)
  }

  const formatDuration = (months: number) => {
    if (months <= 0) {
      return 'Completado'
    }
    if (months < 12) {
      return `${months} meses`
    }
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'año' : 'años'}`
    }
    return `${years} ${years === 1 ? 'año' : 'años'} y ${remainingMonths} meses`
  }

  const handleAddGoal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const target = Number(newGoalTarget)
    if (!newGoalName.trim() || Number.isNaN(target) || target <= 0) {
      return
    }
    await addGoal(newGoalName.trim(), target)
    setNewGoalName('')
    setNewGoalTarget('')
    setActiveModal(null)
  }

  const handleAddContribution = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amount = Number(newContributionAmount)
    if (Number.isNaN(amount) || amount <= 0) {
      return
    }
    const date = newContributionDate || new Date().toISOString().slice(0, 10)
    const note = newContributionNote.trim() || 'Aporte'
    await addContribution(date, amount, note)
    setNewContributionAmount('')
    setNewContributionDate('')
    setNewContributionNote('')
    setActiveModal(null)
  }

  const startEditGoal = (goal: LocalGoal) => {
    setEditingGoalId(goal.id)
    setEditGoalName(goal.name)
    setEditGoalTarget(String(goal.target))
  }

  const handleUpdateGoal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingGoalId) {
      return
    }
    const target = Number(editGoalTarget)
    if (!editGoalName.trim() || Number.isNaN(target) || target <= 0) {
      return
    }
    await updateGoal(editingGoalId, { name: editGoalName.trim(), target })
    setEditingGoalId(null)
    setEditGoalName('')
    setEditGoalTarget('')
  }

  const handleCancelEdit = () => {
    setEditingGoalId(null)
    setEditGoalName('')
    setEditGoalTarget('')
  }

  const handleDeleteGoal = (goal: LocalGoal) => {
    setConfirmModal({ kind: 'goal', id: goal.id, name: goal.name })
  }

  const startEditContribution = (item: LocalContribution) => {
    setEditingContributionId(item.id)
    setEditContributionAmount(String(item.amount))
    setEditContributionDate(item.date)
    setEditContributionNote(item.note)
  }

  const handleUpdateContribution = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingContributionId) {
      return
    }
    const amount = Number(editContributionAmount)
    if (Number.isNaN(amount) || amount <= 0) {
      return
    }
    const date = editContributionDate || new Date().toISOString().slice(0, 10)
    const note = editContributionNote.trim() || 'Aporte'
    await updateContribution(editingContributionId, { amount, date, note })
    setEditingContributionId(null)
    setEditContributionAmount('')
    setEditContributionDate('')
    setEditContributionNote('')
  }

  const handleCancelContributionEdit = () => {
    setEditingContributionId(null)
    setEditContributionAmount('')
    setEditContributionDate('')
    setEditContributionNote('')
  }

  const handleDeleteContribution = (item: LocalContribution) => {
    setConfirmModal({ kind: 'contribution', id: item.id, name: item.note })
  }

  const handleConfirmDelete = async () => {
    if (!confirmModal) {
      return
    }
    if (confirmModal.kind === 'goal') {
      await deleteGoal(confirmModal.id)
      if (editingGoalId === confirmModal.id) {
        handleCancelEdit()
      }
    } else {
      await deleteContribution(confirmModal.id)
      if (editingContributionId === confirmModal.id) {
        handleCancelContributionEdit()
      }
    }
    setConfirmModal(null)
  }

  // Show loading state
  if (authLoading) {
    return (
      <div className="app">
        <div className="login-screen">
          <div className="login-card">
            <p>Cargando...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show login screen if not authenticated
  if (!user) {
    return (
      <div className="app">
        <div className="login-screen">
          <div className="login-card">
            <div className="login-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
            </div>
            <h1>Ahorros App</h1>
            <p>Administra tus metas de ahorro y registra tus aportes.</p>
            <button type="button" className="google-button" onClick={signInWithGoogle}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Iniciar sesión con Google
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isLoading = goalsLoading || contributionsLoading

  return (
    <div className="app">
      <header className="top-bar">
        <div>
          <h1>Objetivos</h1>
          <p className="subtle">Administra tus metas y registra tus ahorros.</p>
        </div>
        <div className="user-menu">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="user-avatar" />
          ) : null}
          <span className="user-name">{user.displayName || user.email}</span>
          <button type="button" className="ghost" onClick={signOut}>
            Salir
          </button>
        </div>
      </header>

      <section className="total-banner">
        <span>Total ahorrado</span>
        <strong>{formatCurrency(totalSaved)}</strong>
      </section>

      <nav className="tabs" aria-label="Navegacion principal">
        <button
          type="button"
          className={`tab-button ${screen === 'goals' ? 'active' : ''}`}
          onClick={() => setScreen('goals')}
        >
          <span className="tab-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M4 10.5 12 5l8 5.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9.5z" />
            </svg>
          </span>
          <span className="tab-label">Objetivos</span>
        </button>
        <button
          type="button"
          className={`tab-button ${screen === 'savings' ? 'active' : ''}`}
          onClick={() => setScreen('savings')}
        >
          <span className="tab-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M4 6h16v3H4zM4 11h16v3H4zM4 16h10v3H4z" />
              <path d="M17 15h-2v2h-2v2h2v2h2v-2h2v-2h-2z" />
            </svg>
          </span>
          <span className="tab-label">Ahorros</span>
        </button>
      </nav>

      {isLoading ? (
        <div className="loading-state">
          <p>Cargando datos...</p>
        </div>
      ) : null}

      {!isLoading && screen === 'goals' ? (
        <section className="goals-view">
          <div className="goals-grid">
            {goals.map((goal) => {
              const progress = Math.min((totalSaved / goal.target) * 100, 100)
              const remaining = Math.max(goal.target - totalSaved, 0)
              const complete = totalSaved >= goal.target
              const ringStyle = { '--progress': `${progress}%` } as CSSProperties
              const conservativeMonths = Math.ceil(remaining / conservativeMonthly)
              const ambitiousMonths = Math.ceil(remaining / ambitiousMonthly)
              return (
                <article key={goal.id} className="goal-card">
                  <div className="goal-header">
                    <div>
                      <h2>{goal.name}</h2>
                      <span className={complete ? 'badge done' : 'badge'}>
                        {complete ? 'Completado' : `${progress.toFixed(0)}%`}
                      </span>
                    </div>
                    <div className="goal-actions">
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => startEditGoal(goal)}
                        aria-label={`Editar objetivo ${goal.name}`}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4 17.25V20h2.75L17.8 8.95l-2.75-2.75L4 17.25z" />
                          <path d="M20.7 7.04a1 1 0 0 0 0-1.41L18.37 3.3a1 1 0 0 0-1.41 0l-1.83 1.83 2.75 2.75 1.82-1.84z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="icon-button danger"
                        onClick={() => handleDeleteGoal(goal)}
                        aria-label={`Eliminar objetivo ${goal.name}`}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M6 7h12l-1 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7z" />
                          <path d="M9 4h6l1 2H8l1-2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="goal-content">
                    <div className="progress-ring" style={ringStyle}>
                      <div className="progress-inner">
                        <strong>{progress.toFixed(0)}%</strong>
                        <span>{formatCurrency(goal.target)}</span>
                      </div>
                    </div>
                    <div className="goal-metrics">
                      <div>
                        <span className="label">Ahorrado</span>
                        <strong>{formatCurrency(totalSaved)}</strong>
                      </div>
                      <div>
                        <span className="label">Falta</span>
                        <strong>{formatCurrency(remaining)}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="goal-forecast">
                    <span className="label">Proyeccion mensual</span>
                    <div className="forecast-row">
                      <div>
                        <span className="forecast-label">Conservador</span>
                        <strong>{formatDuration(conservativeMonths)}</strong>
                        <span className="muted">
                          {formatCurrency(conservativeMonthly)}/mes
                        </span>
                      </div>
                      <div>
                        <span className="forecast-label">Audaz</span>
                        <strong>{formatDuration(ambitiousMonths)}</strong>
                        <span className="muted">
                          {formatCurrency(ambitiousMonthly)}/mes
                        </span>
                      </div>
                    </div>
                  </div>
                  {editingGoalId === goal.id ? (
                    <form className="edit-form" onSubmit={handleUpdateGoal}>
                      <label>
                        Nombre
                        <input
                          type="text"
                          value={editGoalName}
                          onChange={(event) => setEditGoalName(event.target.value)}
                          required
                        />
                      </label>
                      <label>
                        Monto objetivo
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={editGoalTarget}
                          onChange={(event) => setEditGoalTarget(event.target.value)}
                          required
                        />
                      </label>
                      <div className="edit-actions">
                        <button type="submit">Guardar cambios</button>
                        <button type="button" className="ghost" onClick={handleCancelEdit}>
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : null}
                </article>
              )
            })}
            {goals.length === 0 ? (
              <div className="empty-state">
                <h3>Agrega tu primer objetivo</h3>
                <p>Empieza definiendo una meta y un monto objetivo.</p>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="fab fab-goals"
            onClick={() => setActiveModal('addGoal')}
            aria-label="Agregar objetivo"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M11 5h2v14h-2z" />
              <path d="M5 11h14v2H5z" />
            </svg>
            <span className="fab-label">Nuevo objetivo</span>
          </button>
        </section>
      ) : null}

      {!isLoading && screen === 'savings' ? (
        <section className="savings">
          <div className="history">
            <div className="panel-header">
              <h2>Historial de aportes</h2>
            </div>
            <div className="history-list">
              {contributions.length === 0 ? (
                <div className="history-item">
                  <div>
                    <strong>Sin aportes todavía</strong>
                    <span>Agrega un monto para comenzar.</span>
                  </div>
                </div>
              ) : (
                contributions.map((item) => (
                  <div key={item.id} className="history-item">
                    <div>
                      <strong>{item.note}</strong>
                      <span>{formatDate(item.date)}</span>
                      {editingContributionId === item.id ? (
                        <form
                          className="history-edit"
                          onSubmit={handleUpdateContribution}
                        >
                          <label>
                            Monto
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={editContributionAmount}
                              onChange={(event) =>
                                setEditContributionAmount(event.target.value)
                              }
                              required
                            />
                          </label>
                          <label>
                            Fecha
                            <input
                              type="date"
                              value={editContributionDate}
                              onChange={(event) =>
                                setEditContributionDate(event.target.value)
                              }
                            />
                          </label>
                          <label>
                            Nota
                            <input
                              type="text"
                              value={editContributionNote}
                              onChange={(event) =>
                                setEditContributionNote(event.target.value)
                              }
                            />
                          </label>
                          <div className="edit-actions">
                            <button type="submit">Guardar</button>
                            <button
                              type="button"
                              className="ghost"
                              onClick={handleCancelContributionEdit}
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : null}
                    </div>
                    <div className="history-meta">
                      <strong>{formatCurrency(item.amount)}</strong>
                      <div className="history-actions">
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => startEditContribution(item)}
                          aria-label={`Editar aporte ${item.note}`}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 17.25V20h2.75L17.8 8.95l-2.75-2.75L4 17.25z" />
                            <path d="M20.7 7.04a1 1 0 0 0 0-1.41L18.37 3.3a1 1 0 0 0-1.41 0l-1.83 1.83 2.75 2.75 1.82-1.84z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="icon-button danger"
                          onClick={() => handleDeleteContribution(item)}
                          aria-label={`Eliminar aporte ${item.note}`}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M6 7h12l-1 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7z" />
                            <path d="M9 4h6l1 2H8l1-2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <button
            type="button"
            className="fab fab-savings"
            onClick={() => setActiveModal('addContribution')}
            aria-label="Agregar ahorro"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M11 5h2v14h-2z" />
              <path d="M5 11h14v2H5z" />
            </svg>
            <span className="fab-label">Nuevo ahorro</span>
          </button>
        </section>
      ) : null}

      {confirmModal ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Confirmar eliminacion</h3>
            <p>
              {confirmModal.kind === 'goal'
                ? `¿Eliminar el objetivo "${confirmModal.name}"?`
                : `¿Eliminar el aporte "${confirmModal.name}"?`}
            </p>
            <div className="modal-actions">
              <button type="button" className="ghost" onClick={() => setConfirmModal(null)}>
                Cancelar
              </button>
              <button type="button" className="danger" onClick={handleConfirmDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeModal === 'addGoal' ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Nuevo objetivo</h3>
            <form className="form-card" onSubmit={handleAddGoal}>
              <label>
                Nombre
                <input
                  type="text"
                  placeholder="Viaje a Japón"
                  value={newGoalName}
                  onChange={(event) => setNewGoalName(event.target.value)}
                  required
                />
              </label>
              <label>
                Monto objetivo
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="15000"
                  value={newGoalTarget}
                  onChange={(event) => setNewGoalTarget(event.target.value)}
                  required
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setActiveModal(null)}
                >
                  Cancelar
                </button>
                <button type="submit">Crear objetivo</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {activeModal === 'addContribution' ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Cargar ahorro</h3>
            <form className="form-card" onSubmit={handleAddContribution}>
              <label>
                Monto
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="300"
                  value={newContributionAmount}
                  onChange={(event) => setNewContributionAmount(event.target.value)}
                  required
                />
              </label>
              <label>
                Fecha
                <input
                  type="date"
                  value={newContributionDate}
                  onChange={(event) => setNewContributionDate(event.target.value)}
                />
              </label>
              <label>
                Nota
                <input
                  type="text"
                  placeholder="Aporte extra"
                  value={newContributionNote}
                  onChange={(event) => setNewContributionNote(event.target.value)}
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setActiveModal(null)}
                >
                  Cancelar
                </button>
                <button type="submit">Guardar aporte</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
