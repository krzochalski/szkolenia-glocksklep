import { joinSx } from '../joinSx';
import type { ContainerProps } from '../primitives';
import { Container } from '../primitives';

const pageColumnSx = {
	py: 4,
	gap: 4,
	display: 'flex',
	flexDirection: 'column',
} as const;

/** Page body: centered `xl` column, `py: 4`, flex column, `gap: 4` (32px).
 *
 * `sx` merges after those styles, so a later value wins. Pass only extras
 * (`pb`, `overflow`). `maxWidth={false}` is full bleed. `component="main"` when
 * this column is the page landmark.
 *
 * @example
 * ```tsx
 * import { PageColumn, mobileStickyContentPb } from '@stayfrosty/ui';
 *
 * <PageColumn component="main">
 *   <h1>Title</h1>
 * </PageColumn>
 *
 * <PageColumn sx={{ pb: mobileStickyContentPb }}>{children}</PageColumn>
 * ```
 */
export const PageColumn = ({ sx, maxWidth = 'xl', ...props }: ContainerProps) => (
	<Container maxWidth={maxWidth} {...props} sx={joinSx(pageColumnSx, sx)} />
);
