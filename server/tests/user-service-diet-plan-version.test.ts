import UserService from "../src/services/userService";

describe("UserService trainer diet-plan version", () => {
  test("resolves a subtrainer through the owning head trainer id", async () => {
    const service = new UserService() as any;
    service.trainerRepository = {
      findById: jest.fn().mockResolvedValue({ dietPlanVersion: 2 }),
      findOne: jest.fn(),
    };

    const version = await service.getTrainerDietPlanVersion({
      _id: "subtrainer-user-1",
      trainerId: "head-trainer-1",
      role: "subTrainer",
    });

    expect(version).toBe(2);
    expect(service.trainerRepository.findById).toHaveBeenCalledWith("head-trainer-1");
    expect(service.trainerRepository.findOne).not.toHaveBeenCalled();
  });

  test("falls back to the trainer record linked by userId", async () => {
    const service = new UserService() as any;
    service.trainerRepository = {
      findById: jest.fn(),
      findOne: jest.fn().mockResolvedValue({ dietPlanVersion: 2 }),
    };

    const version = await service.getTrainerDietPlanVersion({
      _id: "trainer-user-1",
      role: "trainer",
    });

    expect(version).toBe(2);
    expect(service.trainerRepository.findOne).toHaveBeenCalledWith({
      query: { userId: "trainer-user-1" },
    });
  });

  test("keeps legacy trainer accounts on V1 when no trainer record is found", async () => {
    const service = new UserService() as any;
    service.trainerRepository = {
      findById: jest.fn().mockResolvedValue(null),
      findOne: jest.fn().mockResolvedValue(null),
    };

    const version = await service.getTrainerDietPlanVersion({
      _id: "trainer-user-1",
      trainerId: "missing-trainer",
      role: "trainer",
    });

    expect(version).toBe(1);
  });
});
