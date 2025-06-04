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
      {
        name: 'Leaves 1.20.6',
        bukkitVersion: '1.20.6-215-e234432 (MC: 1.20.6)',
        bukkitName: 'Leaves',
        expected: 'Leaves',
      },
      {
        name: 'Leaf 1.21',
        bukkitVersion: '1.21-DEV-3d7de13 (MC: 1.21)',
        bukkitName: 'Leaf',
        expected: 'Leaf',
      },
      {
        name: 'Pufferfish 1.20.4',
        bukkitVersion: 'git-Pufferfish-52 (MC: 1.20.4)',
        bukkitName: 'Pufferfish',
        expected: 'Pufferfish',
      },
      {
        name: 'UniverseSpigot 1.21.4',
        bukkitVersion: '1.21.4-4f6cdd2 (MC: 1.21.4)',
        bukkitName: 'UniverseSpigot',
        expected: 'UniverseSpigot',
      },
      {
        name: 'AdvancedSlimePaper 1.21.1',
        bukkitVersion: '1.21.1-16392-ba950ec (MC: 1.21.1)',
        bukkitName: 'AdvancedSlimePaper',
        expected: 'AdvancedSlimePaper',
      },
      {
        name: 'Carbon 1.8.8',
        bukkitVersion: 'git-Carbon-"b98d6e2f" (MC: 1.8.8)',
        bukkitName: 'CraftBukkit',
        expected: 'Carbon',
      },
      {
        name: 'Ketting 1.20.1',
        bukkitVersion: 'git-ketting-1.20.1-0.4.14 (MC: 1.20.1)',
        bukkitName: 'CraftBukkit',
        expected: 'Ketting',
      },
      {
        name: 'AxolotlSpigot 1.20.4',
        bukkitVersion: 'git-Axolotl-"228c3df" (MC: 1.20.4)',
        bukkitName: 'AxolotlSpigot',
        expected: 'AxolotlSpigot',
      },
      {
        name: 'AxolotlSpigot 1.21.1',
        bukkitVersion: '1.21.1-DEV-393582c (MC: 1.21.1)',
        bukkitName: 'Axolotl',
        // I just assume it's the same?
        expected: 'AxolotlSpigot',
      },
      {
        name: 'Plazma 1.20.4',
        bukkitVersion: 'git-Plazma-"3972882" (MC: 1.20.4)',
        bukkitName: 'Plazma',
        expected: 'Plazma',
      },
      {
        name: 'SlimeWorldManager 1.20.4',
        bukkitVersion: 'git-SlimeWorldManager-15679 (MC: 1.20.4)',
        bukkitName: 'SlimeWorldManager',
        expected: 'SlimeWorldManager',
      },
      {
        name: 'DivineMC 1.20.4',
        bukkitVersion: 'git-DivineMC-"ab0f2e9" (MC: 1.20.4)',
        bukkitName: 'DivineMC',
        expected: 'DivineMC',
      },
      {
        name: 'DivineMC 1.21.4',
        bukkitVersion: '1.21.4-476-c0ca1f9 (MC: 1.21.4)',
        bukkitName: 'DivineMC',
        expected: 'DivineMC',
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
