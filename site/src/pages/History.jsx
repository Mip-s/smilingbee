import { Text } from "../ui.jsx";
import { useContent } from "../ContentContext.jsx";

export default function History() {
  const { history } = useContent();
  return (
    <section className="section page">
      <div className="container">
        <h2 className="pixel">History</h2>
        <ol className="timeline">
          {history.entries.map((e, i) => (
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
