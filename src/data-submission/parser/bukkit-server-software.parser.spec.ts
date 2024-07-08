import { BukkitServerSoftwareParser } from './bukkit-server-software.parser';

describe('bukkit-server-software.parser', () => {
  let parser: BukkitServerSoftwareParser;

  beforeEach(() => {
    parser = new BukkitServerSoftwareParser();
  });

  describe('parse', () => {
    const testCases = [
      {
        name: 'Paper 1.21',
        bukkitVersion: '1.21-38-1f5db50 (MC: 1.21)',
        bukkitName: 'Paper',
        expected: 'Paper',
      },
      {
        name: 'Paper 1.20',
        bukkitVersion: 'git-Paper-196 (MC: 1.20.1)',
        bukkitName: 'Paper',
        expected: 'Paper',
      },
      {
        name: 'Spigot 1.21',
        bukkitVersion: '4226-Spigot-146439e-2889b3a (MC: 1.21)',
        bukkitName: 'CraftBukkit',
        expected: 'Spigot',
      },
      {
        name: 'Purpur 1.21',
        bukkitVersion: '1.21-2250-797ce6b (MC: 1.21)',
        bukkitName: 'Purpur',
        expected: 'Purpur',
      },
      {
        name: 'Purpur 1.20',
        bukkitVersion: 'git-Purpur-2062 (MC: 1.20.1)',
        bukkitName: 'Purpur',
        expected: 'Purpur',
      },
      {
        name: 'Glowstone 1.12.2',
        bukkitVersion: '2021.7.0-SNAPSHOT.09043bd (MC: 1.12.2)',
        bukkitName: 'Glowstone',
        expected: 'Glowstone',
      },
      {
        name: '"CraftBukkit" 1.21',
        bukkitVersion: '4226-Bukkit-2889b3a (MC: 1.21)',
        bukkitName: 'CraftBukkit',
        expected: 'Bukkit',
      },
      {
        name: 'CatServer 1.18',
        bukkitVersion: '1.18.2-edda1229 (MC: 1.18.2)',
        bukkitName: 'CatServer',
        expected: 'CatServer',
      },
      {
        name: 'Folia 1.20.6',
        bukkitVersion: '1.20.6-5-d797082 (MC: 1.20.6)',
        bukkitName: 'Folia',
        expected: 'Folia',
      },
      {
        name: 'Folia 1.20.1',
        bukkitVersion: 'git-Folia-17 (MC: 1.20.1)',
        bukkitName: 'Folia',
        expected: 'Folia',
      },
      {
        name: 'Arclight 1.21',
        bukkitVersion: 'arclight-1.21-1.0.0-SNAPSHOT-b3349e9 (MC: 1.21)',
        bukkitName: 'Arclight',
        expected: 'Arclight',
      },
      {
        name: 'TacoSpigot 1.9.4',
        bukkitVersion: 'git-TacoSpigot-"af15657" (MC: 1.9.4)',
        bukkitName: 'Paper',
        expected: 'TacoSpigot',
      },
    ];

    testCases.forEach((testCase) => {
      it(`should return ${testCase.expected} for ${testCase.name}`, () => {
        const result = parser.parse(
          { idCustom: 'test' } as any,
          {
            bukkitVersion: testCase.bukkitVersion,
            bukkitName: testCase.bukkitName,
          } as any,
          0,
        );
        expect(result).toHaveLength(1);
        expect(result?.[0]?.data?.value).toBe(testCase.expected);
      });
    });
  });
});
