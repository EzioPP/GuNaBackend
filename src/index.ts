import { app } from '@/modules/controller/rest/app';
import logger from '@/shared/logger';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});
