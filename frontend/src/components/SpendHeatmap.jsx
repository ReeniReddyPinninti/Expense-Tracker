import { useState, useMemo } from 'react';
import { getHeatmapData, getIntensityColor } from '../utils/heatmapHelpers';

function SpendHeatmap({ expenses }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [selectedDay, setSelectedDay] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const days = useMemo(() => getHeatmapData(expenses, year), [expenses, year]);
  const maxAmount = useMemo(() => Math.max(...days.map((d) => d.amount), 1), [days]);

  // group days into weeks (columns), padding the first week so Jan 1 lands on the correct weekday
  const weeks = useMemo(() => {
    const result = [];
    let currentWeek = new Array(days[0]?.day || 0).fill(null);

    days.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length) result.push(currentWeek);
    return result;
  }, [days]);

  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = null;

    weeks.forEach((week, weekIndex) => {
      // find the first real (non-null) day in this week
      const firstRealDay = week.find((d) => d !== null);
      if (!firstRealDay) return;

      const month = new Date(firstRealDay.date).getMonth();
      if (month !== lastMonth) {
        labels.push({ weekIndex, label: new Date(firstRealDay.date).toLocaleDateString('en-US', { month: 'short' }) });
        lastMonth = month;
      }
    });

    return labels;
  }, [weeks]);

  const availableYears = useMemo(() => {
    const years = new Set(expenses.map((e) => new Date(e.date).getFullYear()));
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [expenses]);

  const selectedDayExpenses = selectedDay
    ? expenses.filter((e) => new Date(e.date).toISOString().split('T')[0] === selectedDay)
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#3A3335]">Spend Calendar</h2>
        <select
          value={year}
          onChange={(e) => {
            setYear(Number(e.target.value));
            setSelectedDay(null);
          }}
          className="border border-gray-200 rounded-lg text-sm p-1.5 focus:outline-none focus:ring-2 focus:ring-[#D88C9A]"
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        {/* Month labels row */}
        <div className="flex gap-[3px] mb-1 relative" style={{ height: '14px' }}>
          {weeks.map((_, wIndex) => {
            const monthLabel = monthLabels.find((m) => m.weekIndex === wIndex);
            return (
              <div key={wIndex} className="w-3 text-[10px] text-gray-400 relative">
                {monthLabel && (
                  <span className="absolute left-0 whitespace-nowrap">{monthLabel.label}</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-[3px]">
          {weeks.map((week, wIndex) => (
            <div key={wIndex} className="flex flex-col gap-[3px]">
              {week.map((day, dIndex) => (
                <div
                  key={dIndex}
                  onClick={() => day && setSelectedDay(day.date)}
                  onMouseEnter={(e) => {
                    if (day) {
                      setHoveredDay(day);
                      setMousePos({ x: e.clientX, y: e.clientY });
                    }
                  }}
                  onMouseMove={(e) => {
                    if (day) setMousePos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`w-3 h-3 rounded-sm ${
                    day ? 'cursor-pointer hover:ring-2 hover:ring-[#D88C9A]' : ''
                  }`}
                  style={{
                    backgroundColor: day ? getIntensityColor(day.amount, maxAmount) : 'transparent',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Floating tooltip that follows the cursor */}
      {hoveredDay && (
        <div
          className="fixed z-50 bg-[#3A3335] text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: mousePos.x + 12,
            top: mousePos.y + 12,
          }}
        >
          <div className="font-medium">
            {new Date(hoveredDay.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
          <div className="text-gray-300">
            {hoveredDay.amount > 0 ? `$${hoveredDay.amount.toFixed(2)} spent` : 'No expenses'}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
        <span>Less</span>
        {[0, 0.2, 0.45, 0.7, 1].map((r) => (
          <div key={r} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getIntensityColor(r, 1) }} />
        ))}
        <span>More</span>
      </div>

      {/* Clicked-day detail panel */}
      {selectedDay && (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-[#3A3335] mb-2">
            {new Date(selectedDay).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          {selectedDayExpenses.length === 0 ? (
            <p className="text-sm text-gray-400">No expenses on this day.</p>
          ) : (
            <ul className="space-y-1">
              {selectedDayExpenses.map((e) => (
                <li key={e._id} className="text-sm text-gray-500 flex justify-between">
                  <span>
                    {e.shopName}
                    {e.category && ` · ${e.category.name}`}
                  </span>
                  <span>${e.amount}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default SpendHeatmap;