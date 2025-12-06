

import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import CreateQuiz from "./CreateQuiz.jsx";

const API_BASE = "http://localhost:8080";

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem("quizapp_token"));
  useEffect(() => { localStorage.setItem("quizapp_token", token || ""); }, [token]);
  return { token, setToken };
}

function App() {
  const auth = useAuth();
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar token={auth.token} setToken={auth.setToken} />
        <main className="p-4 max-w-4xl mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup setToken={auth.setToken} />} />
            <Route path="/login" element={<Login setToken={auth.setToken} />} />
            <Route path="/quizzes" element={<QuizList token={auth.token} />} />
            <Route path="/quizzes/:id" element={<QuizDetail token={auth.token} />} />
            <Route path="/attempts" element={<MyAttempts token={auth.token} />} />
            <Route path="/create-quiz" element={<CreateQuiz />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Navbar({ token, setToken }) {
  const navigate = useNavigate();
  function logout() { setToken(null); localStorage.removeItem("quizapp_token"); navigate('/'); }
  return (
    <header className="bg-white shadow">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg">QuizApp</Link>
        <nav className="space-x-3">
          <Link to="/quizzes" className="text-sm">Quizzes</Link>
          {token ? (
            <>
              <Link to="/attempts" className="text-sm">My Attempts</Link>
              <button onClick={logout} className="ml-3 px-3 py-1 bg-red-500 text-white rounded">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm">Login</Link>
              <Link to="/signup" className="ml-2 text-sm">Signup</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function Home() {
  return (
    <div className="text-center py-16">
      <h1 className="text-3xl font-bold">Welcome to QuizApp</h1>
      <p className="mt-4 text-gray-600">Create quizzes, take them, and track attempts.</p>
      <div className="mt-6">
        <Link to="/quizzes" className="px-4 py-2 bg-blue-600 text-white rounded">Browse Quizzes</Link>
      </div>
    </div>
  );
}

function Signup({ setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault(); setErr(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setErr(body?.error || 'Signup failed');
        return;
      }
      // auto-login
      const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await loginRes.json();
      setToken(data.token);
      navigate('/quizzes');
    } catch (e) { setErr(e.message); }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Sign up</h2>
      {err && <div className="mb-3 text-red-600">{err}</div>}
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full p-2 border rounded" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input type="password" className="w-full p-2 border rounded" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="w-full bg-green-600 text-white py-2 rounded">Sign up</button>
      </form>
    </div>
  );
}

function Login({ setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault(); setErr(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) { setErr('Login failed'); return; }
      const data = await res.json();
      setToken(data.token);
      navigate('/quizzes');
    } catch (e) { setErr(e.message); }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      {err && <div className="mb-3 text-red-600">{err}</div>}
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full p-2 border rounded" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input type="password" className="w-full p-2 border rounded" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="w-full bg-blue-600 text-white py-2 rounded">Login</button>
      </form>
    </div>
  );
}

function QuizList({ token }) {
  const [quizzes, setQuizzes] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => { fetchQuizzes(); }, []);
  async function fetchQuizzes() {
    try {
      const res = await fetch(`${API_BASE}/api/quizzes`, { headers: authHeader(token) });
      if (!res.ok) { setErr('Failed to load'); return; }
      setQuizzes(await res.json());
    } catch (e) { setErr(e.message); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Quizzes</h2>
        <Link to="/" className="text-sm text-gray-600">Home</Link>
      </div>

      {err && <div className="text-red-600">{err}</div>}
      <div className="grid gap-4">
        {quizzes.map(q => (
          <div key={q.id} className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">{q.title}</h3>
            <p className="text-sm text-gray-600">{q.description}</p>
            <div className="mt-3">
              <Link to={`/quizzes/${q.id}`} className="px-3 py-1 bg-indigo-600 text-white rounded">Open</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizDetail({ token }) {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [selected, setSelected] = useState({}); // questionId -> optionId
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchQuiz(); }, [id]);
  async function fetchQuiz() {
    try {
      const res = await fetch(`${API_BASE}/api/quizzes/${id}`, { headers: authHeader(token) });
      if (!res.ok) { setErr('Failed to load quiz'); return; }
      setQuiz(await res.json());
    } catch (e) { setErr(e.message); }
  }

  async function submit() {
    try {
      const body = { quizId: Number(id), answers: Object.entries(selected).map(([qId, optId]) => ({ questionId: Number(qId), selectedOptionId: Number(optId) })) };
      const res = await fetch(`${API_BASE}/api/attempts/submit`, { method: 'POST', headers: { ...authHeader(token), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        setErr(b?.error || 'Submit failed');
        return;
      }
      const data = await res.json();
      navigate('/attempts');
    } catch (e) { setErr(e.message); }
  }

  if (!quiz) return <div>Loading...</div>;
  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-lg font-bold">{quiz.title}</h2>
      <p className="text-sm text-gray-600">{quiz.description}</p>
      <div className="mt-4 space-y-4">
        {quiz.questions.map(q => (
          <div key={q.id} className="border rounded p-3">
            <div className="font-medium">{q.text}</div>
            <div className="mt-2 space-y-2">
              {q.options.map(o => (
                <label key={o.id} className="flex items-center space-x-2">
                  <input type="radio" name={`q_${q.id}`} checked={String(selected[q.id]) === String(o.id)} onChange={() => setSelected({ ...selected, [q.id]: o.id })} />
                  <div>{o.text}</div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      {err && <div className="text-red-600 mt-3">{err}</div>}
      <div className="mt-4">
        <button onClick={submit} className="px-4 py-2 bg-green-600 text-white rounded">Submit Attempt</button>
      </div>
    </div>
  );
}

function MyAttempts({ token }) {
  const [attempts, setAttempts] = useState([]);
  const [err, setErr] = useState(null);
  useEffect(() => { fetchAttempts(); }, []);
  async function fetchAttempts() {
    try {
      const res = await fetch(`${API_BASE}/api/attempts/me`, { headers: authHeader(token) });
      if (!res.ok) { setErr('Failed'); return; }
      setAttempts(await res.json());
    } catch (e) { setErr(e.message); }
  }
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">My Attempts</h2>
      {err && <div className="text-red-600">{err}</div>}
      <div className="space-y-3">
        {attempts.map(a => (
          <div key={a.id} className="bg-white p-3 rounded shadow">
            <div>Quiz ID: {a.quizId}</div>
            <div>Score: {a.score}</div>
            <div className="text-sm text-gray-500">{a.attemptedAt}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default App;
