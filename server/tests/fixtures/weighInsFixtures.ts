export const ValidWeighIn = {
  weight: 150,
};

export const InvalidWeighIn = {
  weight: -10,
};

export const ValidWeighIns = {
  userId: "someUserId",
  weighIns: [
    {
      weight: 150,
    },
    {
      weight: 160,
    },
  ],
};

export const InvalidWeighIns = {
  userId: "someUserId",
  weighIns: [
    {
      weight: 150,
    },
    {
      weight: -160,
    },
  ],
};
