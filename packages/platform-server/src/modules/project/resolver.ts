/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { HttpException, HttpStatus } from '@nestjs/common'
import { Resolver, Query, Args, Mutation, ResolveField, Parent, ObjectType, Field, ID } from '@nestjs/graphql'

import { Project, User } from '@perfsee/platform-server/db'
import { PaginationInput, PaginatedType, paginate, Paginated } from '@perfsee/platform-server/graphql'
import { GitHost } from '@perfsee/shared'

import { CurrentUser, Auth, SkipAuth } from '../auth'
import { PermissionGuard, Permission } from '../permission'

import { ProjectService } from './service'
import { CreateProjectInput, UpdateProjectInput, UserWithPermission } from './types'

@ObjectType()
export class PaginatedProjects extends Paginated(Project) {}

@ObjectType()
export class ProjectIdVerificationResult {
  @Field(() => Boolean)
  ok!: boolean

  @Field(() => String, { nullable: true })
  error!: string | undefined
}

@Auth()
@Resolver(() => Project)
export class ProjectResolver {
  constructor(private readonly projectService: ProjectService) {}

  @SkipAuth('skip it for public project, permission guard will cover it')
  @Query(() => Project, { name: 'project', description: 'get project by id' })
  async getProjectById(@Args({ name: 'id', type: () => ID }) slug: string, @CurrentUser() user?: User) {
    const project = await this.projectService.getAccessibleProject(slug, user)
    if (!project) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND)
    }

    return project
  }

  @Query(() => ProjectIdVerificationResult, {
    name: 'verifyProjectId',
    description: 'Verify that the project id is available',
  })
  async verifyProjectId(@Args({ name: 'id', type: () => ID }) slug: string) {
    return this.projectService.verifyNewSlug(slug)
  }

  @Query(() => [Project], { name: 'projectsByRepo', description: 'get project by repo' })
  async getProjectsByRepo(
    @CurrentUser() user: User,
    @Args({ name: 'host', type: () => GitHost, description: 'codebase host' }) host: GitHost,
    @Args({ name: 'namespace', type: () => String, description: 'codebase namespace' }) namespace: string,
    @Args({ name: 'name', type: () => String, description: 'codebase repo name' }) name: string,
  ) {
    return this.projectService.filterUnaccessibleProjects(
      await this.projectService.getProjectsByRepo(host, namespace, name),
      user,
      Permission.Read,
    )
  }

  @Query(() => PaginatedProjects, { name: 'projects', description: 'paginated projects' })
  async getProjects(
    @CurrentUser() user: User,
    @Args({ name: 'pagination', nullable: true, defaultValue: { first: 10 } })
    paginationInput: PaginationInput,
    @Args({ name: 'starred', nullable: true, defaultValue: false, description: 'filter your starred projects' })
    starred: boolean,
    @Args({
      name: 'query',
      nullable: true,
      type: () => String,
      description: 'search project with git namespace/name',
    })
    query: string | undefined,
    @Args({
      name: 'permission',
      nullable: true,
      type: () => Permission,
      description: 'filter project with permission',
    })
    permission: Permission | undefined,
  ): Promise<PaginatedType<Project>> {
    const [projects, totalCount] = await this.projectService.getProjects(
      user,
      paginationInput,
      query,
      starred,
      permission,
    )
    return paginate(projects, 'id', paginationInput, totalCount)
  }

  @Mutation(() => Project)
  async createProject(@CurrentUser() user: User, @Args('input') input: CreateProjectInput) {
    return this.projectService.create(user, input)
  }

  @PermissionGuard(Permission.Admin, 'projectId')
  @Mutation(() => Project)
  async updateProject(
    @Args({ name: 'projectId', type: () => ID }) slug: string,
    @Args('input') input: UpdateProjectInput,
  ) {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(slug)
    return this.projectService.update(projectRawId, input)
  }

  @PermissionGuard(Permission.Admin, 'projectId')
  @Mutation(() => Boolean)
  async addProjectOwner(
    @Args({ name: 'projectId', type: () => ID }) slug: string,
    @Args({ name: 'email', type: () => String }) email: string,
  ) {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(slug)
    await this.projectService.addProjectOwner(projectRawId, email)
    return true
  }

  @PermissionGuard(Permission.Admin, 'projectId')
  @Mutation(() => Boolean)
  async updateProjectUserPermission(
    @Args({ name: 'projectId', type: () => ID }) slug: string,
    @Args({ name: 'email', type: () => String }) email: string,
    @Args({ name: 'permission', type: () => Permission }) permission: Permission,
    @Args({ name: 'isAdd', type: () => Boolean }) isAdd: boolean,
  ) {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(slug)
    await this.projectService.updateProjectUserPermission(projectRawId, email, permission, isAdd)
    return true
  }

  @PermissionGuard(Permission.Read, 'projectId')
  @Mutation(() => Boolean)
  async toggleStarProject(
    @CurrentUser() user: User,
    @Args({ name: 'projectId', type: () => ID }) slug: string,
    @Args({ name: 'star', type: () => Boolean }) star: boolean,
  ) {
    await this.projectService.toggleStarProject(user.id, slug, star)
    return true
  }

  @ResolveField(() => [UserWithPermission], { description: 'authorized users of this project' })
  async authorizedUsers(@Parent() project: Project) {
    return this.projectService.getAuthorizedUsers(project)
  }

  @Mutation(() => Boolean, {
    description: 'Delete project with given id. NOTE: all data in this project will be deleted.',
  })
  @PermissionGuard(Permission.Admin, 'projectId')
  async deleteProject(@Args({ name: 'projectId', type: () => ID }) slug: string) {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(slug)
    await this.projectService.deleteProject(projectRawId)

    return true
  }

  @ResolveField(() => [Permission], { description: 'current user permission to this project' })
  async userPermission(@CurrentUser() user: User, @Parent() project: Project) {
    if (!user) {
      return []
    }

    return this.projectService.getUserPermission(user, project)
  }
}

@Resolver(() => User)
export class UserProjectResolver {
  constructor(private readonly service: ProjectService) {}

  @ResolveField(() => [ID])
  starredProjects(@Parent() user: User) {
    return this.service.getUserStarredProjectSlugs(user.id)
  }
}
