// js/db.js

async function loadStats() {
  const snap = await db
    .collection("trees")
    .where("collegeId", "==", userCollege)
    .get();

  let total = 0,
    healthy = 0,
    needsCare = 0;

  snap.forEach((doc) => {
    total++;
    const t = doc.data();
    if (t.healthStatus === "healthy") healthy++;
    if (["poor", "dying"].includes(t.healthStatus)) needsCare++;
  });

  totalTrees.textContent = total;
  healthyTrees.textContent = healthy;
  needsCareTrees.textContent = needsCare;
}

async function addTree(tree) {
  await db.collection("trees").add(tree);
}

async function getAllTrees() {
  return await db
    .collection("trees")
    .where("collegeId", "==", userCollege)
    .get();
}
