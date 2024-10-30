import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Landing } from './components/Landing';
import { Room } from './components/Room';

const App = () => {
  const dummyName = 'User';

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/room"
          element={
            <Room
              name={dummyName}
              localAudioTrack={null}
              localVideoTrack={null}
            />
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
