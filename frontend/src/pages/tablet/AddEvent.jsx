import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService, cityService } from '../../services/api';
import AdminSidebar from '../../components/tablet/AdminSidebar';
import Swal from 'sweetalert2';
import './AddEvent.css';

const PremiumSwal = Swal.mixin({
    customClass: {
        popup: 'premium-swal-popup',
        title: 'premium-swal-title',
        htmlContainer: 'premium-swal-text',
        confirmButton: 'premium-swal-confirm',
        cancelButton: 'premium-swal-cancel',
    },
    buttonsStyling: false,
});

export default function AddEvent() {
    const navigate = useNavigate();
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        cityId: '',
        eventName: '',
        description: '',
        wikiUrl: '',
        date: '',
        dateNumeric: 0,
        location: '',
        purpose: '',
        exhibitName: '',
        imageUrl: '',
        noGlobalInfluence: false,
    });

    useEffect(() => {
        cityService.getAll().then((r) => setCities(r.data)).catch(console.error);
    }, []);

    /**
     * Parse date string to numeric value for sorting.
     * Supports: "4th BCE", "247 BCE", "1867", "1505", "3rd century CE"
     */
    const parseDateNumeric = (dateStr) => {
        if (!dateStr) return 0;
        const s = dateStr.trim();

        // Direct year
        const yearMatch = s.match(/^(\d{3,4})$/);
        if (yearMatch) return parseInt(yearMatch[1], 10);

        // "Nth BCE" - like "4th BCE" meaning 4th century BCE
        const nthBCE = s.match(/(\d+)(?:st|nd|rd|th)\s*BCE/i);
        if (nthBCE) return -(parseInt(nthBCE[1], 10) - 1) * 100 - 50;

        // "Nth CE" - like "4th CE" meaning 4th century CE
        const nthCE = s.match(/(\d+)(?:st|nd|rd|th)\s*CE/i);
        if (nthCE) return (parseInt(nthCE[1], 10) - 1) * 100 + 50;

        // "247 BCE"
        const bceMatch = s.match(/(\d+)\s*BCE/i);
        if (bceMatch) return -parseInt(bceMatch[1], 10);

        // Century full: "3rd century BCE"
        const centuryMatch = s.match(/(\d+)(?:st|nd|rd|th)\s*century\s*(BCE|CE)?/i);
        if (centuryMatch) {
            const c = parseInt(centuryMatch[1], 10);
            const era = (centuryMatch[2] || 'CE').toUpperCase();
            const year = (c - 1) * 100 + 50;
            return era === 'BCE' ? -year : year;
        }

        // Fallback: find any number
        const numMatch = s.match(/(\d+)/);
        if (numMatch) return parseInt(numMatch[1], 10);

        return 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
            ...(name === 'date' ? { dateNumeric: parseDateNumeric(value) } : {}),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.cityId || !form.eventName || !form.date || !form.description) {
            setError('City, event name, date, and description are required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let bypass = false;
            // Check for potential duplicate first
            const dupRes = await eventService.checkDuplicate(form.eventName);
            if (dupRes.data.exists) {
                const result = await PremiumSwal.fire({
                    title: 'Possible Duplicate Found!',
                    html: `
                        <div style="text-align: left; margin-top: 1rem;">
                            <p>An event named "<strong>${dupRes.data.event.eventName}</strong>" already exists.</p>
                            <p><strong>Date:</strong> ${dupRes.data.event.date}</p>
                            <p><strong>Location:</strong> ${dupRes.data.event.location || 'N/A'}</p>
                            <p style="margin-top: 1rem;">Do you want to add this as a new one anyway?</p>
                        </div>
                    `,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, add as new',
                    cancelButtonText: 'No, cancel',
                    reverseButtons: true,
                });

                if (!result.isConfirmed) {
                    setLoading(false);
                    return;
                }
                bypass = true;
            }

            await eventService.create({ ...form, bypassDuplicateCheck: bypass });
            setSuccess('Event created successfully!');
            setForm({ cityId: '', eventName: '', description: '', wikiUrl: '', date: '', dateNumeric: 0, location: '', purpose: '', exhibitName: '', imageUrl: '', noGlobalInfluence: false });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-event-layout">
            <AdminSidebar />
            <div className="add-event">
                <header className="add-event__header glass-card">
                    <button className="btn-glass" onClick={() => navigate('/tablet')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        Back to Dashboard
                    </button>
                    <div className="add-event__title-area">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        <h2>Add Local Event</h2>
                    </div>
                </header>

                <div className="add-event__form-container glass-card animate-fade-in-up">
                    {success && <div className="add-event__success">{success}</div>}
                    {error && <div className="add-event__error">{error}</div>}

                    <form onSubmit={handleSubmit} className="professional-form">
                        <div className="form-section">
                            <h3 className="form-section__title">Event Identity</h3>
                            <div className="add-event__grid">
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label htmlFor="add-name">Event Name *</label>
                                    <input
                                        id="add-name"
                                        name="eventName"
                                        className="input-glass"
                                        placeholder="e.g. Introduction of Buddhism to Sri Lanka"
                                        value={form.eventName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="add-city">City *</label>
                                    <select
                                        id="add-city"
                                        name="cityId"
                                        className="input-glass"
                                        value={form.cityId}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select city...</option>
                                        {cities.map((c) => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="add-date">Date * <small>(e.g. 4th BCE, 1867)</small></label>
                                    <input
                                        id="add-date"
                                        name="date"
                                        className="input-glass"
                                        placeholder="e.g. 4th BCE, 247 BCE, 1867"
                                        value={form.date}
                                        onChange={handleChange}
                                        required
                                    />
                                    {form.dateNumeric !== 0 && (
                                        <small className="date-hint">
                                            Sorting Value: {form.dateNumeric}
                                        </small>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="form-section__title">Context & Details</h3>
                            <div className="add-event__grid">
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <div className="checkbox-group">
                                        <input
                                            type="checkbox"
                                            id="add-no-influence"
                                            name="noGlobalInfluence"
                                            checked={form.noGlobalInfluence}
                                            onChange={handleChange}
                                        />
                                        <label htmlFor="add-no-influence">
                                            No Global Influence
                                            <small className="label-hint">Exclude this event from global history thematic analysis</small>
                                        </label>
                                    </div>
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label htmlFor="add-desc">Description *</label>
                                    <textarea
                                        id="add-desc"
                                        name="description"
                                        className="input-glass"
                                        placeholder="Describe the historical event..."
                                        value={form.description}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="add-location">Exact Location</label>
                                    <input
                                        id="add-location"
                                        name="location"
                                        className="input-glass"
                                        placeholder="e.g. Anuradhapura, Sri Lanka"
                                        value={form.location}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="add-purpose">Category</label>
                                    <input
                                        id="add-purpose"
                                        name="purpose"
                                        className="input-glass"
                                        placeholder="e.g. Religion/Culture, Trade"
                                        value={form.purpose}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="form-section__title">Media & Sources</h3>
                            <div className="add-event__grid">
                                <div className="form-group">
                                    <label htmlFor="add-wiki">Wikipedia URL</label>
                                    <input
                                        id="add-wiki"
                                        name="wikiUrl"
                                        className="input-glass"
                                        placeholder="https://en.wikipedia.org/wiki/..."
                                        value={form.wikiUrl}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="add-image">Image URL</label>
                                    <input
                                        id="add-image"
                                        name="imageUrl"
                                        className="input-glass"
                                        placeholder="https://..."
                                        value={form.imageUrl}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label htmlFor="add-exhibit">Exhibit Name</label>
                                    <input
                                        id="add-exhibit"
                                        name="exhibitName"
                                        className="input-glass"
                                        placeholder="e.g. Ancient Sri Lanka Exhibit"
                                        value={form.exhibitName}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="add-event__actions">
                            <button
                                type="submit"
                                className="btn-orange-outline add-event__submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>Creating…</>
                                ) : (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                        Publish New Event
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
