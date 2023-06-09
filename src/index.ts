import { getSchema as getPrismaSchema } from "@mrleebo/prisma-ast"
import * as graphql from "graphql"
import { Project } from "ts-morph"
import typescript from "typescript"

import { AppContext } from "./context.js"
import { PrismaMap, prismaModeller } from "./prismaModeller.js"
import { lookAtServiceFile } from "./serviceFile.js"
import { createSharedSchemaFiles } from "./sharedSchema.js"
import { CodeFacts, FieldFacts } from "./typeFacts.js"
import { RedwoodPaths } from "./types.js"

export * from "./main.js"
export * from "./types.js"

import { basename, join } from "node:path"

/** The API specifically for Redwood */
export function runFullCodegen(preset: "redwood", config: { paths: RedwoodPaths }): { paths: string[] }

export function runFullCodegen(preset: string, config: unknown): { paths: string[] }

export function runFullCodegen(preset: string, config: unknown): { paths: string[] } {
	if (preset !== "redwood") throw new Error("Only Redwood codegen is supported at this time")
	const paths = (config as { paths: RedwoodPaths }).paths
	const sys = typescript.sys

	const pathSettings: AppContext["pathSettings"] = {
		root: paths.base,
		apiServicesPath: paths.api.services,
		prismaDSLPath: paths.api.dbSchema,
		graphQLSchemaPath: paths.generated.schema,
		sharedFilename: "shared-schema-types.d.ts",
		sharedInternalFilename: "shared-return-types.d.ts",
		typesFolderRoot: paths.api.types,
	}

	const project = new Project({ useInMemoryFileSystem: true })

	let gqlSchema: graphql.GraphQLSchema | undefined
	const getGraphQLSDLFromFile = (settings: AppContext["pathSettings"]) => {
		const schema = sys.readFile(settings.graphQLSchemaPath)
		if (!schema) throw new Error("No schema found at " + settings.graphQLSchemaPath)
		gqlSchema = graphql.buildSchema(schema)
	}

	let prismaSchema: PrismaMap = new Map()
	const getPrismaSchemaFromFile = (settings: AppContext["pathSettings"]) => {
		const prismaSchemaText = sys.readFile(settings.prismaDSLPath)
		if (!prismaSchemaText) throw new Error("No prisma file found at " + settings.prismaDSLPath)
		const prismaSchemaBlocks = getPrismaSchema(prismaSchemaText)
		prismaSchema = prismaModeller(prismaSchemaBlocks)
	}

	getGraphQLSDLFromFile(pathSettings)
	getPrismaSchemaFromFile(pathSettings)

	if (!gqlSchema) throw new Error("No GraphQL Schema was created during setup")

	const appContext: AppContext = {
		gql: gqlSchema,
		prisma: prismaSchema,
		tsProject: project,
		codeFacts: new Map<string, CodeFacts>(),
		fieldFacts: new Map<string, FieldFacts>(),
		pathSettings,
		sys,
		join,
		basename,
	}

	// TODO: Maybe Redwood has an API for this? Its grabbing all the services
	const serviceFiles = appContext.sys.readDirectory(appContext.pathSettings.apiServicesPath)
	const serviceFilesToLookAt = serviceFiles.filter((file) => {
		if (file.endsWith(".test.ts")) return false
		if (file.endsWith("scenarios.ts")) return false
		return file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".js")
	})

	const filepaths = [] as string[]

	// Create the two shared schema files
	const sharedDTSes = createSharedSchemaFiles(appContext)
	filepaths.push(...sharedDTSes)

	// This needs to go first, as it sets up fieldFacts
	for (const path of serviceFilesToLookAt) {
		const dts = lookAtServiceFile(path, appContext)
		if (dts) filepaths.push(dts)
	}

	return {
		paths: filepaths,
	}
}
