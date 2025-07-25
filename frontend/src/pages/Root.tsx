import "@pages/Root.css";

import { Link, Outlet } from "react-router-dom";

export default function Root() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link> | <Link to="/upload">Upload</Link>
      </nav>
      <h1>JamFlow</h1>
      <div id="outlet">
        <Outlet />
      </div>
    </>
  );
}
