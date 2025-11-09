import React, { useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  withCredentials: true, // куки автоматически отправляются
});

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [facultyName, setFacultyName] = useState("");
  const [faculties, setFaculties] = useState([]);
  const [groupData, setGroupData] = useState({ name: "", course: 1, degree: "", faculty_id: 0 });
  const [groups, setGroups] = useState([]);
  const [lessonData, setLessonData] = useState({ subject: "", groupname: "", teacher: "", day_of_week: "", starttime: "", endtime: "" });
  const [lessons, setLessons] = useState([]);

  const login = async () => {
    try {
      const res = await api.post("/account/login", { email, password });
      if (res.status === 200) {
        setLoginMessage("Logged in successfully");
      }
    } catch (err) {
      setLoginMessage(err.response?.data?.error || "Login failed");
    }
  };

  const addFaculty = async () => {
    try {
      const res = await api.post("/admin/faculty", { name: facultyName });
      alert(JSON.stringify(res.data));
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const listFaculties = async () => {
    try {
      const res = await api.get("/schedule/faculties");
      setFaculties(res.data);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const addGroup = async () => {
    try {
      const res = await api.post("/admin/group", groupData);
      alert(JSON.stringify(res.data));
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const listGroups = async () => {
    try {
      const res = await api.get("/schedule/groups");
      setGroups(res.data);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const addLesson = async () => {
    try {
      const res = await api.post("/admin/lesson", lessonData);
      alert(JSON.stringify(res.data));
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const listLessons = async () => {
    try {
      const res = await api.get("/schedule/lessons");
      setLessons(res.data);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>TechUp Admin Panel</h1>

      {/* Login */}
      <div>
        <h2>Login</h2>
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button onClick={login}>Login</button>
        <div>{loginMessage}</div>
      </div>

      <hr />

      {/* Faculties */}
      <div>
        <h2>Faculties</h2>
        <input placeholder="Faculty Name" value={facultyName} onChange={e => setFacultyName(e.target.value)} />
        <button onClick={addFaculty}>Add Faculty</button>
        <button onClick={listFaculties}>List Faculties</button>
        <pre>{JSON.stringify(faculties, null, 2)}</pre>
      </div>

      {/* Groups */}
      <div>
        <h2>Groups</h2>
        <input placeholder="Group Name" value={groupData.name} onChange={e => setGroupData({ ...groupData, name: e.target.value })} />
        <input type="number" placeholder="Course" value={groupData.course} onChange={e => setGroupData({ ...groupData, course: Number(e.target.value) })} />
        <input placeholder="Degree" value={groupData.degree} onChange={e => setGroupData({ ...groupData, degree: e.target.value })} />
        <input type="number" placeholder="Faculty ID" value={groupData.faculty_id} onChange={e => setGroupData({ ...groupData, faculty_id: Number(e.target.value) })} />
        <button onClick={addGroup}>Add Group</button>
        <button onClick={listGroups}>List Groups</button>
        <pre>{JSON.stringify(groups, null, 2)}</pre>
      </div>

      {/* Lessons */}
      <div>
        <h2>Lessons</h2>
        <input placeholder="Subject" value={lessonData.subject} onChange={e => setLessonData({ ...lessonData, subject: e.target.value })} />
        <input type="number" placeholder="Group ID" value={lessonData.groupname} onChange={e => setLessonData({ ...lessonData, groupname: Number(e.target.value) })} />
        <input placeholder="Teacher" value={lessonData.teacher} onChange={e => setLessonData({ ...lessonData, teacher: e.target.value })} />
        <input placeholder="Day" value={lessonData.day_of_week} onChange={e => setLessonData({ ...lessonData, day_of_week: e.target.value })} />
        <input placeholder="Start Time" value={lessonData.starttime} onChange={e => setLessonData({ ...lessonData, starttime: e.target.value })} />
        <input placeholder="End Time" value={lessonData.endtime} onChange={e => setLessonData({ ...lessonData, endtime: e.target.value })} />
        <button onClick={addLesson}>Add Lesson</button>
        <button onClick={listLessons}>List Lessons</button>
        <pre>{JSON.stringify(lessons, null, 2)}</pre>
      </div>
    </div>
  );
}

export default App;