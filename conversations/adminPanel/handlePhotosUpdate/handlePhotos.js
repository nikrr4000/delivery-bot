import unlessActions from "#bot/conversations/helpers/unlessActions.js";

export default async (conversation, ctx) =>
{
    const maxFileIdsLength = 6
    conversation.session.temp.fileIds = []
    await conversation.waitUntil(
        async (ctx) =>
        {
            const fileIds = conversation.session.temp.fileIds
            const endConditions = {
                endMark: ctx.message.text === "end",
                maxLength: fileIds.length <= maxFileIdsLength
            }
            const endConditionsValues = Object.values(endConditions)
            const shouldEnd = endConditionsValues.includes(true)
            if (shouldEnd) return true


            if (!ctx.message.photo) return false

            const file = ctx.message.photo.pop();
            conversation.session.temp.fileIds.push(file.file_id);

            await conversation.skip();
        },
        {
            otherwise: (ctx) =>
                unlessActions(ctx, () =>
                {
                    if (ctx.message?.document)
                    {
                        ctx.reply(
                            `Oтправлять можно только изображения формата JPEG`,
                        );
                    }
                }),
        }
    );
}