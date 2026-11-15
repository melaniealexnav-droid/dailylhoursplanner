
import { useState, useEffect } from "react";
import "./App.css";

type Activity = {
  id: number;
  name: string;
  minutes: number;
  hidden: boolean;
  completed: boolean;
};

const categories = [
  "Wellness and self-recovery",
  "SAT/ACT preparation",
  "College activities",
  "Class studying",
  "Homework",
  "Fun and personal time",
];

function formatDuration(minutes: number) {
  const hours = Math.floor(Math.abs(minutes) / 60);
  const mins = Math.abs(minutes) % 60;
  return `${hours}h ${mins}m`;
}

function App() {
  const todayKey = new Date().toLocaleDateString();

const savedPlanner = (() => {
  try {
    return JSON.parse(
      localStorage.getItem(`rebirth-planner-${todayKey}`) || "null"
    );
  } catch {
    return null;
  }
})();
const [currentTime, setCurrentTime] = useState(savedPlanner?.currentTime ?? "00:00");
const [bedtime, setBedtime] = useState(savedPlanner?.bedtime ?? "00:00");
const [capacity, setCapacity] = useState(savedPlanner?.capacity ?? "Normal");
const [funDescription, setFunDescription] = useState(savedPlanner?.funDescription ?? "");

const [activities, setActivities] = useState<Record<string, Activity[]>>(
  savedPlanner?.activities ?? Object.fromEntries(
    categories.map((category, index) => [
      category,
      [{
        id: index + 1,
        name: "",
        minutes: 0,
        hidden: false,
        completed: false,
      }],
    ])
  )
);useEffect(() => {
  localStorage.setItem(
    `rebirth-planner-${todayKey}`,
    JSON.stringify({
      currentTime,
      bedtime,
      capacity,
      funDescription,
      activities,
    })
  );
}, [currentTime, bedtime, capacity, funDescription, activities]);

  

  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const start = toMinutes(currentTime);
  let end = toMinutes(bedtime);
  if (end <= start) end += 1440;

  const availableTime = end - start;

  const plannedTime = Object.values(activities)
    .flat()
    .reduce((total, activity) => total + activity.minutes, 0);

  const remainingTime = availableTime - plannedTime;

  const updateActivity = (
    category: string,
    id: number,
    changes: Partial<Activity>
  ) => {
    setActivities((previous) => ({
      ...previous,
      [category]: previous[category].map((activity) =>
        activity.id === id ? { ...activity, ...changes } : activity
      ),
    }));
  };

  const addActivity = (category: string) => {
    setActivities((previous) => ({
      ...previous,
      [category]: [
        ...previous[category],
        {
          id: Date.now() + Math.random(),
          name: "",
          minutes: 0,
          hidden: false,
          completed: false,
        },
      ],
    }));
  };

  const removeActivity = (category: string, id: number) => {
    setActivities((previous) => ({
      ...previous,
      [category]: previous[category].filter((a) => a.id !== id),
    }));
  };

  const copyPlan = async () => {
    const plan = categories.map((category, index) => {
      const items = activities[category]
        .filter((a) => a.name.trim())
        .map((a) => `${a.name}: ${formatDuration(a.minutes)}`);

      return `${index + 1}. ${category}\n${items.join("\n")}`;
    }).join("\n\n");

    await navigator.clipboard.writeText(
      `REBIRTH PROJECT | DAILY PLAN\nCapacity: ${capacity}\nCurrent time: ${currentTime}\nBedtime: ${bedtime}\n\nAvailable: ${formatDuration(availableTime)}\nPlanned: ${formatDuration(plannedTime)}\nRemaining: ${formatDuration(remainingTime)}\n\n${plan}\n\nPersonal time: ${funDescription}`
    );

    alert("Daily plan copied!");
  };

  return (
    <main className="planner">
      <header>
        <p className="eyebrow">YOUR PERSONAL PLANNING SYSTEM</p>
        <h1>REBIRTH PROJECT</h1>
        <p>DAILY PLAN</p>
      </header>

      <section className="settings">
        <label>
          Capacity
          <select value={capacity} onChange={(e) => setCapacity(e.target.value)}>
            <option>Recovery</option>
            <option>Normal</option>
            <option>Heavy</option>
          </select>
        </label>

        <label>
          Current time
          <input type="time" value={currentTime}
            onChange={(e) => setCurrentTime(e.target.value)} />
        </label>

        <label>
          Bedtime
          <input type="time" value={bedtime}
            onChange={(e) => setBedtime(e.target.value)} />
        </label>
      </section>

      <section className="summary">
        <h2>DAILY TIME SUMMARY</h2>

        <div className="summary-grid">
          <div>
            <span>Available</span>
            <strong>{formatDuration(availableTime)}</strong>
          </div>

          <div>
            <span>Planned</span>
            <strong>{formatDuration(plannedTime)}</strong>
          </div>

          <div>
            <span>Remaining</span>
            <strong className={remainingTime < 0 ? "overtime" : "remaining"}>
              {remainingTime < 0 ? "-" : ""}
              {formatDuration(remainingTime)}
            </strong>
          </div>
        </div>

        <div className="progress-track">
          <div
            className={`progress-fill ${remainingTime < 0 ? "overtime-fill" : ""}`}
            style={{
              width: `${availableTime > 0 ? Math.min(100, (plannedTime / availableTime) * 100) : 0}%`,
            }}
          />
        </div>
      </section>

      {categories.map((category, index) => (
        <section className="category" key={category}>
          <div className="category-heading">
            <div>
              <span className="category-number">{index + 1}.</span>
              <h2>{category}</h2>
            </div>
            <button onClick={() => addActivity(category)}>+ Add</button>
          </div>

          {activities[category].map((activity, activityIndex) => (
            <div className={`activity ${activity.hidden ? "hidden-activity" : ""}`}
              key={activity.id}>
              <span className="activity-number">{activityIndex + 1}.</span>

              <input
                className="minutes"
                type="number"
                min="0"
                value={activity.minutes}
                aria-label="Duration in minutes"
                onChange={(e) => updateActivity(category, activity.id, {
                  minutes: Math.max(0, Number(e.target.value)),
                })}
              />

              <span className="duration-display">
                {formatDuration(activity.minutes)}
              </span>

              <input
                className="activity-name"
                placeholder="New activity"
                value={activity.name}
                onChange={(e) => updateActivity(category, activity.id, {
                  name: e.target.value,
                })}
              />

              <button onClick={() => updateActivity(category, activity.id, {
                hidden: !activity.hidden,
              })}>
                {activity.hidden ? "Show" : "Hide"}
              </button>

              <button className="remove"
                onClick={() => removeActivity(category, activity.id)}>
                ×
              </button>
            </div>
          ))}

          {category === "Fun and personal time" && (
            <textarea
              placeholder="Personal time description..."
              value={funDescription}
              onChange={(e) => setFunDescription(e.target.value)}
            />
          )}
        </section>
      ))}

      <section className="daily-summary">
        <h2>INDIVIDUAL ACTIVITIES</h2>

        {categories.flatMap((category) =>
          activities[category]
            .filter((activity) => activity.name.trim())
            .map((activity, index) => (
              <div className="summary-activity" key={activity.id}>
                <span className={activity.completed ? "completed" : ""}>
                  {activity.name}
                </span>

                <span>
                  {activity.completed ? "" : formatDuration(activity.minutes)}
                </span>

                {activity.completed ? (
                  <strong className="completed-label">COMPLETED</strong>
                ) : (
                  <input
                    type="checkbox"
                    onChange={(e) => updateActivity(category, activity.id, {
                      completed: e.target.checked,
                    })}
                  />
                )}
              </div>
            ))
        )}
      </section>

      <button className="copy-button" onClick={copyPlan}>
        COPY DAILY PLAN
      </button>
    </main>
  );
}

export default App;
