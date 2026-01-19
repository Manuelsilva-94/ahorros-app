import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import './App.css'

type Goal = { id: string; name: string; target: number }
type Contribution = { id: string; date: string; amount: number; note: string }

function App() {
  const [goals, setGoals] = useState(() => {
    const stored = localStorage.getItem('ahorros_goals')
    if (stored) {
      return JSON.parse(stored) as Goal[]
    }
    return [
      { id: 'italia', name: 'Viaje a Italia', target: 7000 },
      { id: 'nueva-york', name: 'Nueva York', target: 5000 },
      { id: 'casa', name: 'Comprar Casa', target: 250000 },
    ]
  })
  const [contributions, setContributions] = useState(() => {
    const stored = localStorage.getItem('ahorros_contributions')
    if (stored) {
      const parsed = JSON.parse(stored) as {
        id: string
        date?: string
        month?: string
        amount: number
        note: string
      }[]
      return parsed.map((item) => ({
        id: item.id,
        date:
          item.date ??
          (item.month ? `${item.month}-01` : new Date().toISOString().slice(0, 10)),
        amount: item.amount,
        note: item.note,
      }))
    }
    return [
      { id: 'c1', date: '2026-01-05', amount: 300, note: 'Enero' },
      { id: 'c2', date: '2026-02-10', amount: 400, note: 'Febrero' },
    ]
  })
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

  useEffect(() => {
    localStorage.setItem('ahorros_goals', JSON.stringify(goals))
  }, [goals])

  useEffect(() => {
    localStorage.setItem('ahorros_contributions', JSON.stringify(contributions))
  }, [contributions])

  const totalSaved = useMemo(() => {
    return contributions.reduce((sum, item) => sum + item.amount, 0)
  }, [contributions])

  const uniqueMonthsCount = useMemo(() => {
    const months = new Set(contributions.map((item) => item.date.slice(0, 7)))
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

  const createId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  const handleAddGoal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const target = Number(newGoalTarget)
    if (!newGoalName.trim() || Number.isNaN(target) || target <= 0) {
      return
    }
    const id = `goal-${createId()}`
    setGoals((prev) => [...prev, { id, name: newGoalName.trim(), target }])
    setNewGoalName('')
    setNewGoalTarget('')
    setActiveModal(null)
  }

  const handleAddContribution = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amount = Number(newContributionAmount)
    if (Number.isNaN(amount) || amount <= 0) {
      return
    }
    const date = newContributionDate || new Date().toISOString().slice(0, 10)
    const note = newContributionNote.trim() || 'Aporte'
    setContributions((prev) => [
      {
        id: `cont-${createId()}`,
        date,
        amount,
        note,
      },
      ...prev,
    ])
    setNewContributionAmount('')
    setNewContributionDate('')
    setNewContributionNote('')
    setActiveModal(null)
  }

  const startEditGoal = (goal: Goal) => {
    setEditingGoalId(goal.id)
    setEditGoalName(goal.name)
    setEditGoalTarget(String(goal.target))
  }

  const handleUpdateGoal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingGoalId) {
      return
    }
    const target = Number(editGoalTarget)
    if (!editGoalName.trim() || Number.isNaN(target) || target <= 0) {
      return
    }
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === editingGoalId ? { ...goal, name: editGoalName.trim(), target } : goal
      )
    )
    setEditingGoalId(null)
    setEditGoalName('')
    setEditGoalTarget('')
  }

  const handleCancelEdit = () => {
    setEditingGoalId(null)
    setEditGoalName('')
    setEditGoalTarget('')
  }

  const handleDeleteGoal = (goal: Goal) => {
    setConfirmModal({ kind: 'goal', id: goal.id, name: goal.name })
  }

  const startEditContribution = (item: Contribution) => {
    setEditingContributionId(item.id)
    setEditContributionAmount(String(item.amount))
    setEditContributionDate(item.date)
    setEditContributionNote(item.note)
  }

  const handleUpdateContribution = (event: React.FormEvent<HTMLFormElement>) => {
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
    setContributions((prev) =>
      prev.map((item) =>
        item.id === editingContributionId ? { ...item, amount, date, note } : item
      )
    )
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

  const handleDeleteContribution = (item: Contribution) => {
    setConfirmModal({ kind: 'contribution', id: item.id, name: item.note })
  }

  const handleConfirmDelete = () => {
    if (!confirmModal) {
      return
    }
    if (confirmModal.kind === 'goal') {
      setGoals((prev) => prev.filter((item) => item.id !== confirmModal.id))
      if (editingGoalId === confirmModal.id) {
        handleCancelEdit()
      }
    } else {
      setContributions((prev) => prev.filter((item) => item.id !== confirmModal.id))
      if (editingContributionId === confirmModal.id) {
        handleCancelContributionEdit()
      }
    }
    setConfirmModal(null)
  }

  return (
    <div className="app">
      <header className="top-bar">
        <div>
          <h1>Objetivos</h1>
          <p className="subtle">Administra tus metas y registra tus ahorros.</p>
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

      {screen === 'goals' ? (
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
            className={`fab ${screen === 'goals' ? 'fab-goals' : 'fab-savings'}`}
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

      {screen === 'savings' ? (
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
            className={`fab ${screen === 'goals' ? 'fab-goals' : 'fab-savings'}`}
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

      {screen === 'addGoal' ? (
        <section className="panel">
          <div className="panel-header">
            <h2>Crear objetivo</h2>
            <button type="button" className="ghost" onClick={() => setScreen('goals')}>
              Volver
            </button>
          </div>
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
            <button type="submit">Crear objetivo</button>
          </form>
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
