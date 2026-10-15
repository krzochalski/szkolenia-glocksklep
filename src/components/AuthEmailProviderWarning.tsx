import { Alert, Typography } from '@ui';

/** Warns that Interia / poczta.fm may block or delay platform emails. */
export const AuthEmailProviderWarning = () => (
	<Alert severity='warning' sx={{ borderRadius: 0, mb: 2 }}>
		<Typography variant='body2'>
			Konta e-mail Interia oraz poczta.fm mogą mieć problemy z wiadomościami z tej platformy
			(rejestracja, linki logowania, reset hasła). Jeśli to możliwe, użyj innego adresu —
			np. Gmail.
		</Typography>
	</Alert>
);
