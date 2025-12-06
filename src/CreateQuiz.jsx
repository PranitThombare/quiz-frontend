import React, { useState } from "react";
import { useNavigate } from "react-router-dom";


export default function CreateQuiz() {
    const API_BASE = "http://localhost:8080";

    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [questions, setQuestions] = useState([
        { text: "", options: [{ text: "", correct: false }] }
    ]);
    const [err, setErr] = useState(null);

    const token = localStorage.getItem("quizapp_token");

    function addQuestion() {
        setQuestions([...questions, { text: "", options: [{ text: "", correct: false }] }]);
    }
    function removeQuestion(i) {
        setQuestions(questions.filter((_, idx) => idx !== i));
    }
    function addOption(qIdx) {
        const copy = [...questions];
        copy[qIdx].options.push({ text: "", correct: false });
        setQuestions(copy);
    }
    function removeOption(qIdx, oIdx) {
        const copy = [...questions];
        copy[qIdx].options = copy[qIdx].options.filter((_, i) => i !== oIdx);
        setQuestions(copy);
    }

    function setQuestionText(i, value) {
        const copy = [...questions]; copy[i].text = value; setQuestions(copy);
    }
    function setOptionText(qIdx, oIdx, value) {
        const copy = [...questions]; copy[qIdx].options[oIdx].text = value; setQuestions(copy);
    }
    function setOptionCorrect(qIdx, oIdx, checked) {
        const copy = [...questions];
        // if you want single-correct per question, set others false:
        copy[qIdx].options = copy[qIdx].options.map((o, i) => ({ ...o, correct: i === oIdx ? checked : false }));
        setQuestions(copy);
    }

    async function submit(e) {
        e.preventDefault();
        setErr(null);
        if (!token) { setErr("Not logged in"); return; }

        const body = { title, description, questions };
        try {
            const res = await fetch(`${API_BASE}/api/quizzes`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            if (!res.ok) {
                const b = await res.json().catch(() => null);
                setErr(b?.error || "Failed to create quiz");
                return;
            }
            const data = await res.json();
            // data.id returned — redirect to quizzes or quiz detail
            navigate(`/quizzes/${data.id}`);
        } catch (err) {
            setErr(err.message);
        }
    }

    return (
        <div className="max-w-3xl mx-auto p-4 bg-white rounded shadow">
            <h2 className="text-xl font-semibold mb-3">Create Quiz</h2>
            {err && <div className="text-red-600 mb-2">{err}</div>}
            <form onSubmit={submit}>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full p-2 border rounded mb-2" />
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="w-full p-2 border rounded mb-4" />

                {questions.map((q, qi) => (
                    <div key={qi} className="mb-4 border p-3 rounded">
                        <div className="flex justify-between items-center mb-2">
                            <strong>Question {qi + 1}</strong>
                            <div>
                                <button type="button" onClick={() => removeQuestion(qi)} className="text-sm text-red-600 ml-2">Remove Q</button>
                            </div>
                        </div>

                        <input value={q.text} onChange={e => setQuestionText(qi, e.target.value)} placeholder="Question text" className="w-full p-2 border rounded mb-2" />

                        <div className="space-y-2">
                            {q.options.map((opt, oi) => (
                                <div key={oi} className="flex items-center space-x-2">
                                    <input type="text" value={opt.text} onChange={e => setOptionText(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}`} className="flex-1 p-2 border rounded" />
                                    <label className="flex items-center space-x-1">
                                        <input type="checkbox" checked={opt.correct} onChange={e => setOptionCorrect(qi, oi, e.target.checked)} />
                                        <span className="text-sm">Correct</span>
                                    </label>
                                    <button type="button" onClick={() => removeOption(qi, oi)} className="text-sm text-red-600">Del</button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addOption(qi)} className="mt-2 text-sm text-blue-600">+ Add option</button>
                        </div>
                    </div>
                ))}

                <div className="flex space-x-2">
                    <button type="button" onClick={addQuestion} className="px-3 py-1 bg-gray-200 rounded">+ Add question</button>
                    <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Create Quiz</button>
                </div>
            </form>
        </div>
    );
}
