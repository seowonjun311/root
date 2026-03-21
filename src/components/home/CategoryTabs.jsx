import React from "react";

const categories = ["운동", "공부", "정신", "일상"];

export default function CategoryTabs({ selected, onChange }) {
  return (
    <div style={styles.wrapper}>
      {categories.map((cat) => {
        const isActive = selected === cat;

        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            style={{
              ...styles.button,
              ...(isActive ? styles.active : {}),
            }}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    gap: "6px",
    padding: "10px 12px 6px",
    overflowX: "auto",
  },

  button: {
    flex: 1,
    minWidth: "70px",
    padding: "8px 0",
    borderRadius: "12px",
    border: "none",
    background: "#f1f3f5",
    fontSize: "13px",
    fontWeight: "600",
    color: "#555",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  active: {
    background: "#111",
    color: "#fff",
  },
};
