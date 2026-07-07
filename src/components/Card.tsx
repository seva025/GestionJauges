type CardProps = {
  title: string;
  value: string | number;
};

export default function Card({ title, value }: CardProps) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 18,
        padding: 24,
        border: "1px solid #e3d3d8",
        boxShadow: "0 18px 50px rgba(78,12,31,.12)"
      }}
    >
      <div
        style={{
          color: "#667085",
          fontSize: 13,
          fontWeight: 900,
          textTransform: "uppercase"
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 42,
          color: "#8a1538",
          fontWeight: 900
        }}
      >
        {value}
      </div>
    </div>
  );
}