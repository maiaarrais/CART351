const entries = document.querySelectorAll(".entry");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let current = 0;
let isAnimating = false;

// show first entry
if (entries.length > 0) {
  entries[0].classList.add("active");
}

// helper to switch entry
function switchEntry(newIndex, direction) {
  if (isAnimating || newIndex === current || entries.length === 0) return;
  isAnimating = true;

  const oldEntry = entries[current];
  const newEntry = entries[newIndex];

  // clear previous animation classes
  oldEntry.classList.remove(
    "active",
    "exit-left",
    "exit-right",
    "enter-from-right",
    "enter-from-left"
  );
  newEntry.classList.remove(
    "active",
    "exit-left",
    "exit-right",
    "enter-from-right",
    "enter-from-left"
  );

  // choose directions
  const exitClass = direction === "next" ? "exit-left" : "exit-right";
  const enterClass = direction === "next" ? "enter-from-right" : "enter-from-left";

  // apply classes
  oldEntry.classList.add(exitClass);
  newEntry.classList.add(enterClass);

  const onAnimationEnd = () => {
    oldEntry.classList.remove("exit-left", "exit-right");
    newEntry.classList.remove("enter-from-right", "enter-from-left");
    newEntry.classList.add("active");

    current = newIndex;
    isAnimating = false;

    newEntry.removeEventListener("animationend", onAnimationEnd);
  };

  newEntry.addEventListener("animationend", onAnimationEnd);
}

// NEXT
nextBtn.addEventListener("click", () => {
  const newIndex = (current + 1) % entries.length;
  switchEntry(newIndex, "next");
});

// PREVIOUS
prevBtn.addEventListener("click", () => {
  const newIndex = (current - 1 + entries.length) % entries.length;
  switchEntry(newIndex, "prev");
});
