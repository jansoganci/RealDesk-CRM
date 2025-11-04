# Contributing to Real Estate CRM

Thank you for your interest in contributing to the Real Estate CRM project! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Questions](#questions)

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js 18.x or higher
- npm 9.x or higher
- Git installed
- A Supabase account (for database features)
- Basic knowledge of React, TypeScript, and Supabase

### Setting Up Development Environment

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/your-username/emlak-crm.git
   cd emlak-crm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Run database migrations**
   ```bash
   # Using Supabase CLI
   supabase db push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names:
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation changes
- `refactor/component-name` - Code refactoring
- `test/test-description` - Test additions

### Feature Development

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow coding standards
   - Write/update tests if applicable
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run typecheck
   npm run lint
   npm run build
   ```

4. **Commit your changes** (see [Commit Guidelines](#commit-guidelines))

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode (already configured)
- Define types for all function parameters and return values
- Use interfaces for object shapes
- Avoid `any` type - use `unknown` if type is truly unknown

### React Components

- Use functional components with hooks
- Use TypeScript for component props
- Extract reusable logic into custom hooks
- Keep components small and focused (single responsibility)
- Use descriptive component and prop names

**Example:**
```typescript
interface PropertyCardProps {
  property: Property;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onEdit,
  onDelete,
}) => {
  // Component implementation
};
```

### File Organization

- Follow the existing folder structure
- Place feature-specific code in `src/features/`
- Reusable components in `src/components/`
- Services in `src/services/`
- Types in `src/types/`
- Utilities in `src/lib/`

### Styling

- Use Tailwind CSS utility classes
- Follow the design system in `src/config/colors.ts`
- Use Radix UI components from `src/components/ui/`
- Ensure mobile-first responsive design
- Maintain 44px minimum touch targets on mobile

### Form Handling

- Use React Hook Form for all forms
- Use Zod for schema validation
- Place schemas in feature folders (e.g., `propertySchema.ts`)
- Provide clear error messages

### Internationalization

- All user-facing text must be internationalized
- Add translations to both `src/locales/en/` and `src/locales/tr/`
- Use translation keys, never hardcoded strings
- Follow existing translation key patterns

**Example:**
```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('properties');
return <h1>{t('title')}</h1>;
```

### Error Handling

- Handle errors gracefully
- Show user-friendly error messages
- Log errors for debugging
- Use toast notifications for user feedback

## Commit Guidelines

### Commit Message Format

Use conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(properties): add photo reordering functionality

Implement drag-and-drop photo reordering with atomic database updates.

Closes #123
```

```
fix(contracts): resolve PDF upload validation issue

Fix validation error when uploading PDF files larger than 5MB.
```

```
docs(readme): update installation instructions

Add Supabase CLI setup steps to README.
```

## Pull Request Process

### Before Submitting

- [ ] Code follows the project's coding standards
- [ ] All tests pass (if applicable)
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation is updated
- [ ] Translations are added for new features
- [ ] Commit messages follow the guidelines

### PR Description

Include:
- **What** - Description of changes
- **Why** - Reason for the change
- **How** - Implementation approach (if relevant)
- **Testing** - How to test the changes
- **Screenshots** - For UI changes

### Review Process

1. PR will be reviewed by maintainers
2. Address any feedback or requested changes
3. Once approved, your PR will be merged
4. Thank you for contributing! 🎉

## Testing

### Manual Testing

- Test on both desktop and mobile devices
- Test in both English and Turkish
- Verify all CRUD operations work correctly
- Test error scenarios
- Check loading states and empty states

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

## Documentation

### Code Documentation

- Add JSDoc comments for complex functions
- Document component props and their types
- Explain non-obvious logic

### Translation Documentation

When adding new features:
1. Add translation keys to both language files
2. Update translation files in `src/locales/en/` and `src/locales/tr/`
3. Use descriptive key names that reflect the feature

### Architecture Documentation

- Update `docs/ARCHITECTURE.md` for significant architectural changes
- Update `docs/API.md` for API changes
- Update `CHANGELOG.md` for user-facing changes

## Database Changes

### Migrations

- Create new migration files in `supabase/migrations/`
- Use timestamp format: `YYYYMMDDHHMMSS_description.sql`
- Test migrations on a local Supabase instance first
- Include both `UP` and `DOWN` migrations if possible
- Document any breaking changes

### RPC Functions

- Document RPC functions with comments
- Include parameter descriptions
- Add error handling

## Questions?

- Open an issue for questions or discussions
- Check existing issues and PRs first
- Be specific about what you need help with

## Recognition

Contributors will be recognized in the project README and release notes.

Thank you for contributing to Real Estate CRM! 🏢✨

