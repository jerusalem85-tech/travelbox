import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const arabicMonths = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const arabicDays = [
  'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
];

const CalendarView = () => {
  const [bookings, setBookings] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayBookings, setDayBookings] = useState([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(lastDayOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const fetchBookings = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('travel_date_from', startDate.toISOString().split('T')[0]);
      params.append('travel_date_to', endDate.toISOString().split('T')[0]);
      const res = await api.get(`/bookings?${params.toString()}`);
      setBookings(res.data.rows || res.data || []);
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToday = () => {
    setCurrentDate(new Date());
  };

  const getBookingsByDate = (dateStr) => {
    return bookings.filter((b) => {
      const travelDate = b.travel_date ? b.travel_date.split('T')[0] : null;
      return travelDate === dateStr;
    });
  };

  const handleDayClick = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayB = getBookingsByDate(dateStr);
    setDayBookings(dayB);
    setSelectedDay({ day, dateStr, count: dayB.length });
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const weeks = [];
  const currentDay = new Date(startDate);
  while (currentDay <= endDate) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push({
        day: currentDay.getDate(),
        month: currentDay.getMonth(),
        year: currentDay.getFullYear(),
        isCurrentMonth: currentDay.getMonth() === month
      });
      currentDay.setDate(currentDay.getDate() + 1);
    }
    weeks.push(week);
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <i className="bi bi-calendar-event me-2"></i>
          عرض التقويم
        </h4>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex gap-2">
              <button className="btn btn-outline-primary" onClick={prevMonth}>
                <i className="bi bi-chevron-right"></i>
              </button>
              <button className="btn btn-outline-primary" onClick={nextMonth}>
                <i className="bi bi-chevron-left"></i>
              </button>
            </div>
            <h5 className="mb-0 mx-3">
              {arabicMonths[month]} {year}
            </h5>
            <button className="btn btn-outline-secondary" onClick={goToday}>
              <i className="bi bi-calendar-check me-1"></i>
              اليوم
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered text-center mb-0">
              <thead className="table-light">
                <tr>
                  {arabicDays.map((d) => (
                    <th key={d} className="py-2">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, wIdx) => (
                  <tr key={wIdx} style={{ height: '90px' }}>
                    {week.map((wDay, dIdx) => {
                      const dateStr = `${wDay.year}-${String(wDay.month + 1).padStart(2, '0')}-${String(wDay.day).padStart(2, '0')}`;
                      const dayB = getBookingsByDate(dateStr);
                      const isSelectedDay = selectedDay && wDay.day === selectedDay.day && wDay.month === selectedDay.month;
                      return (
                        <td
                          key={dIdx}
                          onClick={() => wDay.isCurrentMonth && handleDayClick(wDay.day)}
                          className={`align-top position-relative ${wDay.isCurrentMonth ? 'cursor-pointer' : 'text-muted bg-light'} ${isToday(wDay.day) ? 'bg-primary bg-opacity-10 border-primary border-2' : ''} ${isSelectedDay ? 'bg-info bg-opacity-10' : ''}`}
                          style={{ cursor: wDay.isCurrentMonth ? 'pointer' : 'default', minWidth: '100px' }}
                        >
                          <div className="fw-bold mb-1">{wDay.day}</div>
                          {dayB.length > 0 && (
                            <div className="d-flex flex-wrap gap-1 justify-content-center">
                              <span className="badge bg-primary rounded-pill">{dayB.length} حجز</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedDay && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-calendar-day me-2"></i>
                  حجوزات {selectedDay.day} {arabicMonths[month]} {year}
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedDay(null)}></button>
              </div>
              <div className="modal-body">
                {dayBookings.length === 0 ? (
                  <div className="text-center py-3 text-muted">
                    <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                    لا توجد حجوزات في هذا اليوم
                  </div>
                ) : (
                  <div className="list-group">
                    {dayBookings.map((b) => (
                      <div key={b.id} className="list-group-item list-group-item-action">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>#{b.booking_number || b.id}</strong>
                            <span className="mx-2">-</span>
                            {b.customer_name || 'اسم العميل'}
                          </div>
                          <span className="badge bg-info">{b.status || '-'}</span>
                        </div>
                        {b.travel_date && (
                          <small className="text-muted d-block mt-1">
                            <i className="bi bi-calendar me-1"></i>
                            {new Date(b.travel_date).toLocaleDateString('ar-SA')}
                          </small>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedDay(null)}>إغلاق</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
