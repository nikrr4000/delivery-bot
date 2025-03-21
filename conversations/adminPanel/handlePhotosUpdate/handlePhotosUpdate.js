import { getOrder } from "#bot/api/firebase.api.js";
import unlessActions from "#bot/conversations/helpers/unlessActions.js";
import { getOrderIds, handleResult, messageTexts } from "../utils.js";
import handlePhotos from "./handlePhotos.js";
import { InlineKeyboard, InputMediaBuilder } from "grammy";

const handleSendMediaGroup = async (ctx, userId, mediaGroup) =>
{
    let resultText
    try
    {
        const userMessageRes = await ctx.api.sendMediaGroup(userId, mediaGroup)
        if (!userMessageRes) throw new Error();
        resultText = messageTexts.jobDone
    } catch (err)
    {
        resultText = 'Во время отправки произошла ошибка, попробуйте позже'
    }
    handleResult(ctx, resultText)
}

// TODO: завод-реплаер идущий по объекту 

export async function handlePhotosUpdate(conversation, ctx)
{
    await ctx.reply(messageTexts.sendOrderUniqueId)
    const { message: { text: orderIdsText } } = await conversation.wait()
    const [, userId, orderDbId] = getOrderIds(orderIdsText)

    const order = await getOrder(userId, orderDbId)
    const generatedId = order.orderId

    await ctx.reply(messageTexts.sendPhotos)
    await handlePhotos(conversation, ctx)
    const fileIds = conversation.session.temp.fileIds

    const mediaGroup = fileIds.map(id => InputMediaBuilder.photo(id))
    mediaGroup[0].caption = `Фотоотчет товара по заказу #${generatedId}.`

    await ctx.reply(messageTexts.shoudSendQuestion)
    await ctx.replyWithMediaGroup(mediaGroup)
    await ctx.reply('Подтвердить отправку?', {
        reply_markup: new InlineKeyboard()
            .text(messageTexts.confirmSending, 'confirm')
            .row()
            .text(messageTexts.confirmSending, 'cancel')
    })

    const { match } = await conversation.waitForCallbackQuery(/confirm|cancel/, {
        otherwise: (ctx) =>
            unlessActions(ctx, () => { })
    })

    const isConfirmed = match[0] === "confirm"
    isConfirmed ?
        handleSendMediaGroup(ctx, userId, mediaGroup) :
        handleResult(ctx, messageTexts.sendingIsCanceled)
}