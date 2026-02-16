import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import GeneratorPage from "./pages/GeneratorPage";
import ResultPage from "./pages/ResultPage";

export default function App() {
  const [result, setResult] = useState(null);
  const [formInput, setFormInput] = useState(null);

  const handleResult = (data, input) => {
    setResult(data);
    setFormInput(input);
  };

  return (
    <BrowserRouter>
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<GeneratorPage onResult={handleResult} />} />
          <Route
            path="/result"
            element={<ResultPage result={result} formInput={formInput} />}
          />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
