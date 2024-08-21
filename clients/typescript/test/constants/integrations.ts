import {on} from "../../src/mocks";

export const postgresMock1 =
    on({integration: "postgres", stepName: "step1"}, (params) => (params.stepName === "step1"))
        .return([{"date":"2026-01-01", "faraday-future": "100", "tesla": "10"}])

export const mysqlMock1 =
    on({integration: "mysql"})
        .return((inputs) => {return inputs})