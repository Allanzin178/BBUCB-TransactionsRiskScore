import { DriverService } from "./config/neo4j.config.ts";
const neo4jDb = new DriverService()

try {
  const { records, summary } = await neo4jDb.executeQuery(
    `
        MATCH (player:PLAYER {name: "LeBron James"}) -[r:PLAYED_AGAINST]-> (t)
        RETURN player, r, t
        `,
    {}
  );

  for (let record of records) {
    record.keys.forEach((key) => {
      const object = record.get(key);
      console.log(object?.properties.name || "Não tem nome");
    });
  };

} catch (error) {
  console.log("Erro na execução do codigo: ");
  console.log(error)
}
