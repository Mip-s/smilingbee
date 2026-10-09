import data from "../content/history.json";
import { Text } from "../ui.jsx";

export default function History() {
  return (
    <section className="section page">
      <div className="container">
        <h2 className="pixel">History</h2>
        <ol className="timeline">
          {data.entries.map((e, i) => (
            <li key={i}>
              <Text value={e.date} as="div" className="date" />
              <Text value={e.title} as="h3" />
              <Text value={e.text} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
