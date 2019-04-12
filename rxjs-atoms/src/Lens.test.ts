import { Lens, ReadLens } from "./Lens";
import { L } from ".";

interface Monster {
  name: string;
  element: "fire" | "water" | "air" | "earth";
  hp: number;
  friends: Monster[];
}

const mockMonster: Monster = {
  name: "Gilbert",
  element: "fire",
  hp: 100,
  friends: [{ name: "Dilbert", friends: [], hp: 100, element: "water" }]
};

const mockMonster2: Monster = {
  name: "Lenzilla",
  element: "air",
  hp: 500,
  friends: []
};

const mockMonster3: Monster = {
  name: "Monadster",
  element: "fire",
  hp: 9000,
  friends: [mockMonster2]
};

describe("Lens", () => {
  it("can be constructed manually from getter/setter", () => {
    const nameL = new Lens<Monster, string>(
      monster => monster.name,
      (monster, name) => ({ ...monster, name })
    );

    expect(nameL.get(mockMonster)).toStrictEqual(mockMonster.name);
    expect(nameL.set(mockMonster, "Hulbert")).toStrictEqual({
      ...mockMonster,
      name: "Hulbert"
    });
  });

  it("can be composed with a Lens, resulting in a Lens", () => {
    const firstFriendL = new Lens<Monster, Monster[]>(
      monster => monster.friends,
      (monster, friends) => ({ ...monster, friends })
    ).compose(
      new Lens(
        friends => friends[0],
        (friends, friend) => {
          const clone = [...friends];
          clone[0] = friend;
          return clone;
        }
      )
    );

    expect(firstFriendL).toBeInstanceOf(Lens);
    expect(firstFriendL.get(mockMonster)).toStrictEqual(mockMonster.friends[0]);
  });

  it("can be composed with a ReadLens, resulting in a ReadLens", () => {
    const nameLengthL = L.id<Monster>()
      .prop("name")
      .compose(new ReadLens(x => x.length));

    expect(nameLengthL).not.toBeInstanceOf(Lens);
    expect(nameLengthL).toBeInstanceOf(ReadLens);
  });
});

describe("L.prop", () => {
  const nameL = L.id<Monster>().prop("name");

  test("Law: Get-Put", () => {
    expect(nameL.get(nameL.set(mockMonster, mockMonster.name))).toStrictEqual(
      mockMonster.name
    );
  });

  test("Law: Put-Get", () => {
    expect(nameL.get(nameL.set(mockMonster, "Bert"))).toEqual("Bert");
  });

  test("Law: Put-Put", () => {
    expect(nameL.set(nameL.set(mockMonster, "Name 1"), "Name 2")).toStrictEqual(
      nameL.set(mockMonster, "Name 2")
    );
  });
});

describe("ReadLens", () => {
  it("can be constructed manually from a getter", () => {
    const hp10XL = new ReadLens<Monster, number>(monster => monster.hp * 10);

    expect(hp10XL).toBeInstanceOf(ReadLens);
    expect(hp10XL.get(mockMonster)).toEqual(mockMonster.hp * 10);
  });

  it("can be composed with a Lens, resulting in a ReadLens", () => {
    const nameReadL = L.id<Monster>()
      .asRead()
      .compose(L.prop("name"));

    expect(nameReadL).not.toBeInstanceOf(Lens);
    expect(nameReadL).toBeInstanceOf(ReadLens);
  });

  it("can be composed with a ReadLens, resulting in a ReadLens", () => {
    const nameReadL = L.id<Monster>()
      .asRead()
      .compose(new ReadLens(x => x.name));

    expect(nameReadL).not.toBeInstanceOf(Lens);
    expect(nameReadL).toBeInstanceOf(ReadLens);
  });

  describe(".map", () => {
    it("is equivalent to .compose(new ReadLens(x => ...))", () => {
      const nameLengthMapL = L.id<Monster>().map(x => x.name.length);
      const nameLengthComposeL = L.id<Monster>().compose(
        new ReadLens(x => x.name.length)
      );

      expect(nameLengthMapL.get(mockMonster)).toStrictEqual(
        nameLengthComposeL.get(mockMonster)
      );
    });
  });
});

describe("L.id", () => {
  it("gets the original object", () => {
    const monsterL = L.id<Monster>();
    expect(monsterL.get(mockMonster)).toStrictEqual(mockMonster);
  });

  it("sets the entire object", () => {
    const monsterL = L.id<Monster>();
    const replacementMonster: Monster = { ...mockMonster, hp: 100 };

    expect(monsterL.set(mockMonster, replacementMonster)).toStrictEqual(
      replacementMonster
    );
  });
});

describe("L.nth", () => {
  const firstL = L.nth<Monster[], 0>(0);

  test("Law: Get-Put", () => {
    expect(
      firstL.get(firstL.set(mockMonster.friends, mockMonster.friends[0]))
    ).toStrictEqual(mockMonster.friends[0]);
  });

  test("Law: Put-Get", () => {
    expect(firstL.get(firstL.set(mockMonster.friends, mockMonster2))).toEqual(
      mockMonster2
    );
  });

  test("Law: Put-Put", () => {
    expect(
      firstL.set(firstL.set(mockMonster.friends, mockMonster2), mockMonster3)
    ).toStrictEqual(firstL.set(mockMonster.friends, mockMonster3));
  });
});
